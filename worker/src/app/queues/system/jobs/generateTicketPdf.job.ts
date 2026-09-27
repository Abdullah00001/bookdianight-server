import fs from 'fs';
import path from 'path';
import os from 'os';
import Handlebars from 'handlebars';
import clubTicketTemplate from '@/app/templates/clubTicket.template';
import eventTicketTemplate from '@/app/templates/eventTicket.template';
import { renderHtmlToPdf } from '@/app/utils/pdf.utils';

import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';
import { QUEUE_JOBS } from '@/const';
import { IJobHandler } from '@/app/@types/queue.types';
import { singleUploadToS3 } from '@/app/utils/s3.utils';
import { find as geoTzFind } from 'geo-tz';

const formatToVenueTime = (date: Date, timeZone: string) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(date);
};

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

      let venueTimeZone = 'America/Chicago'; // fallback

      if (order.serviceType === 'CLUB' && order.clubBooking) {
        const club = order.clubBooking.clubPackage?.club;
        if (club && club.lat !== undefined && club.lng !== undefined) {
          const tzs = geoTzFind(club.lat, club.lng);
          if (tzs && tzs.length > 0) venueTimeZone = tzs[0];
        }
      } else if (order.serviceType === 'EVENT' && order.eventPurchase) {
        const event = order.eventPurchase.event;
        if (event && event.lat !== undefined && event.lng !== undefined) {
          const tzs = geoTzFind(event.lat, event.lng);
          if (tzs && tzs.length > 0) venueTimeZone = tzs[0];
        }
      }

      // 3. Generate PDF
      const buyerInformation = {
        name: order.buyer.name,
        email: order.buyer.email,
        orderId: order.id,
        dateOfPurchase: formatToVenueTime(order.createdAt, venueTimeZone),
      };
      const paymentInformation = {
        currency: order.currency.toUpperCase(),
        grossAmount: order.grossAmount.toString(),
        serviceCharge: order.serviceChargeAmount.toString(),
        totalAmount: order.buyerTotal.toString(),
      };
      const ticketType = order.serviceType;

      let renderedHtml = '';

      if (order.serviceType === 'CLUB' && order.clubBooking) {
        const cb = order.clubBooking;
        const template = Handlebars.compile(clubTicketTemplate);
        renderedHtml = template({
          ticketType,
          buyerInformation,
          clubBookingDetails: {
            clubName: cb.clubName,
            location: cb.clubLocation,
            packageName: cb.packageName,
            startDateTime: formatToVenueTime(cb.startAt, venueTimeZone),
            endDateTime: formatToVenueTime(cb.endAt, venueTimeZone),
            totalGuests: cb.guestCount,
          },
          paymentInformation,
        });
      } else if (order.serviceType === 'EVENT' && order.eventPurchase) {
        const ep = order.eventPurchase;
        const template = Handlebars.compile(eventTicketTemplate);

        let attendees: { index: number; name: string }[] = [];
        if (ep.attendees && ep.attendees.length > 0) {
          attendees = ep.attendees.map((att, idx) => ({
            index: idx + 1,
            name: att.name,
          }));
        }

        renderedHtml = template({
          ticketType,
          buyerInformation,
          eventTicketDetails: {
            eventName: ep.eventName,
            location: ep.eventLocation,
            startDateTime: formatToVenueTime(ep.eventStartAt, venueTimeZone),
            endDateTime: formatToVenueTime(ep.eventEndAt, venueTimeZone),
            totalPersons: ep.personCount,
          },
          attendees,
          paymentInformation,
        });
      } else {
        throw new Error(
          `Unknown service type or missing booking details for order ${orderId}`
        );
      }

      tempFilePath = path.join(os.tmpdir(), `ticket_${orderId}.pdf`);

      const pdfBytes = await renderHtmlToPdf(renderedHtml);
      await fs.promises.writeFile(tempFilePath, pdfBytes);

      // 4. Upload to S3
      // WHY: The repository's canonical object-key representation is used to persist the exact storage identifier.
      // S3 will overwrite the same key cleanly if BullMQ retries an upload.
      const key = `tickets/${orderId}.pdf`;
      await singleUploadToS3({
        filePath: tempFilePath,
        key,
        mimeType: 'application/pdf',
        acl: 'private',
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
