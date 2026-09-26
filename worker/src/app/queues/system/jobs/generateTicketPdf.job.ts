import fs from 'fs';
import path from 'path';
import os from 'os';
import PDFDocument from 'pdfkit';

import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';
import { QUEUE_JOBS } from '@/const';
import { IJobHandler } from '@/app/@types/queue.types';
import { singleUploadToS3 } from '@/app/utils/s3.utils';

const handler: IJobHandler = {
  name: QUEUE_JOBS.GENERATE_TICKET_PDF,
  handler: async (data: any) => {
    const { orderId } = data;

    // 1. Idempotency Check
    // WHY: Check TicketPdf to prevent duplicate generation. If webhooks are delivered twice or BullMQ retries,
    // this ensures we don't accidentally create multiple successful PDF records for the same Order.
    let ticketPdf = await prisma.ticketPdf.findUnique({
      where: { orderId },
    });

    if (ticketPdf && ticketPdf.status === 'GENERATED') {
      logger.info(
        `[generateTicketPdf] Ticket PDF already generated for order ${orderId}`
      );
      return;
    }

    if (!ticketPdf) {
      throw new Error(
        `[generateTicketPdf] TicketPdf record unexpectedly missing for order ${orderId}. Ensure payment transaction correctly persisted the PENDING state.`
      );
    }

    let tempFilePath = '';

    try {
      // 2. Load CURRENT database state
      // WHY: Webhook payloads can be stale. We must load the committed database state
      // (Order, ClubBooking, EventPurchase) to guarantee accurate PDF fulfillment data.
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: true,
          clubBooking: {
            include: {
              clubPackage: {
                include: { club: true },
              },
            },
          },
          eventPurchase: {
            include: {
              event: true,
              attendees: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // WHY: We strictly only generate PDFs for orders that have successfully reached PAID status.
      if (order.status !== 'PAID') {
        throw new Error(`Order ${orderId} is not PAID`);
      }

      // 3. Generate PDF
      // WHY QR IS ABSENT: The current product rule is NO QR. We adhere to exactly what's requested.
      const doc = new PDFDocument({ margin: 50 });
      tempFilePath = path.join(os.tmpdir(), `ticket_${orderId}.pdf`);

      const writeStream = fs.createWriteStream(tempFilePath);
      doc.pipe(writeStream);

      // Title
      doc.fontSize(24).text('Booking Confirmation', { align: 'center' });
      doc.moveDown(2);

      // Buyer Info
      doc.fontSize(14).text('Buyer Information', { underline: true });
      doc
        .fontSize(12)
        .text(`Name: ${order.buyer.name}`)
        .text(`Email: ${order.buyer.email}`)
        .text(`Order ID: ${order.id}`)
        .text(`Date of Purchase: ${order.createdAt.toISOString()}`);
      doc.moveDown(2);

      if (order.serviceType === 'CLUB' && order.clubBooking) {
        const cb = order.clubBooking;

        doc.fontSize(14).text('Club Booking Details', { underline: true });
        doc
          .fontSize(12)
          .text(`Club: ${cb.clubName}`)
          .text(`Location: ${cb.clubLocation}`)
          .text(`Package: ${cb.packageName}`)
          .text(
            `Date/Time: ${cb.startAt.toISOString()} to ${cb.endAt.toISOString()}`
          )
          .text(`Guests: ${cb.guestCount}`);
      } else if (order.serviceType === 'EVENT' && order.eventPurchase) {
        const ep = order.eventPurchase;

        doc.fontSize(14).text('Event Ticket Details', { underline: true });
        doc
          .fontSize(12)
          .text(`Event: ${ep.eventName}`)
          .text(`Location: ${ep.eventLocation}`)
          .text(
            `Date/Time: ${ep.eventStartAt.toISOString()} to ${ep.eventEndAt.toISOString()}`
          )
          .text(`Persons: ${ep.personCount}`);

        if (ep.attendees && ep.attendees.length > 0) {
          doc.moveDown(1);
          doc.fontSize(12).text('Attendees:', { underline: true });
          ep.attendees.forEach((att, idx) => {
            doc.text(`${idx + 1}. ${att.name}`);
          });
        }
      } else {
        throw new Error(
          `Unknown service type or missing booking details for order ${orderId}`
        );
      }

      doc.moveDown(2);

      // Financial Info
      // WHY: Use immutable persisted snapshot values rather than trying to recalculate historical amounts.
      doc.fontSize(14).text('Payment Information', { underline: true });
      doc
        .fontSize(12)
        .text(
          `Gross Amount: ${order.currency.toUpperCase()} ${order.grossAmount.toString()}`
        )
        .text(
          `Service Charge: ${order.currency.toUpperCase()} ${order.serviceChargeAmount.toString()}`
        )
        .text(
          `Total Amount: ${order.currency.toUpperCase()} ${order.buyerTotal.toString()}`
        );

      doc.end();

      // Wait for write stream to finish
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      // 4. Upload to S3
      // WHY: The repository's canonical object-key representation is used to persist the exact storage identifier.
      // S3 will overwrite the same key cleanly if BullMQ retries an upload.
      const key = `tickets/${orderId}.pdf`;
      await singleUploadToS3({
        filePath: tempFilePath,
        key,
        mimeType: 'application/pdf',
      });

      // 5. Update DB strictly AFTER successful upload
      // WHY: Never mark GENERATED or store the storageKey if the file hasn't been durably stored.
      // If DB fails here, BullMQ retries and safely overwrites S3 because we haven't lost state (DB is still PENDING/FAILED).
      await prisma.ticketPdf.update({
        where: { id: ticketPdf.id },
        data: {
          status: 'GENERATED',
          storageKey: key, // Canonical key, not the public URL
          generatedAt: new Date(),
        },
      });

      logger.info(
        `[generateTicketPdf] Ticket PDF generated and uploaded successfully for order ${orderId}`
      );
    } catch (error) {
      logger.error(
        `[generateTicketPdf] Failed to generate Ticket PDF for order ${orderId}`,
        error
      );

      await prisma.ticketPdf.update({
        where: { id: ticketPdf.id },
        data: { status: 'FAILED' },
      });

      // WHY: Rethrow to propagate to the existing worker failure/retry mechanism.
      throw error;
    } finally {
      // 6. Temporary file cleanup
      // WHY: The temporary local PDF file must always be removed in finally to avoid disk leaks.
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          logger.error(
            `[generateTicketPdf] Failed to delete temporary file ${tempFilePath}`,
            cleanupError
          );
        }
      }
    }
  },
};

export default handler;
