import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';
import { ICronJob } from '@/app/@types/job.types';
import { getSystemQueue } from '@/app/queues/system/system.queue';

const TAG = '[recoverTicketPdfs]';
const GENERATE_TICKET_PDF = 'generate-ticket-pdf';

/**
 * Cron job that recovers TicketPdfs for PAID orders.
 *
 * It looks for:
 * A. TicketPdfs stuck in PENDING for > 15 minutes.
 * B. PAID Orders > 15 minutes old with NO TicketPdf (due to a previous failed queue handoff).
 *
 * Re-enqueues the GENERATE_TICKET_PDF system job with a deterministic jobId.
 */
const recoverTicketPdfsJob: ICronJob = {
  name: 'recoverTicketPdfs',
  schedule: '*/15 * * * *',
  execute: async (): Promise<void> => {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    logger.info(
      `${TAG} TicketPdf recovery started. Cutoff: ${cutoff.toISOString()}`
    );

    try {
      // Scenario A: Stuck PENDING tickets
      const stuckTickets = await prisma.ticketPdf.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lte: cutoff },
        },
        select: { orderId: true },
      });

      // Scenario B: Missing TicketPdfs for PAID Orders
      const missingTickets = await prisma.order.findMany({
        where: {
          status: 'PAID',
          createdAt: { lte: cutoff },
          ticketPdf: null,
        },
        select: { id: true },
      });

      let recoveredCount = 0;

      // Process Stuck Tickets (Scenario A)
      for (const ticket of stuckTickets) {
        try {
          await getSystemQueue().add(
            GENERATE_TICKET_PDF,
            { orderId: ticket.orderId },
            {
              jobId: `ticket-pdf-${ticket.orderId}`,
              removeOnComplete: true,
              removeOnFail: false,
            }
          );
          recoveredCount++;
        } catch (err) {
          logger.error(
            `${TAG} Failed to re-enqueue stuck ticket for order ${ticket.orderId}`,
            { error: err }
          );
        }
      }

      // Process Missing Tickets (Scenario B)
      for (const order of missingTickets) {
        try {
          // 1. Durably create the missing PENDING record first
          await prisma.ticketPdf.create({
            data: {
              orderId: order.id,
              status: 'PENDING',
            },
          });

          // 2. Safely enqueue the generation job
          await getSystemQueue().add(
            GENERATE_TICKET_PDF,
            { orderId: order.id },
            {
              jobId: `ticket-pdf-${order.id}`,
              removeOnComplete: true,
              removeOnFail: false,
            }
          );
          recoveredCount++;
        } catch (err) {
          logger.error(
            `${TAG} Failed to recover missing ticket for order ${order.id}`,
            { error: err }
          );
        }
      }

      logger.info(
        `${TAG} TicketPdf recovery completed successfully. Recovered: ${recoveredCount}`
      );
    } catch (error) {
      logger.error(`${TAG} TicketPdf recovery failed`, { error });
    }
  },
};

export default recoverTicketPdfsJob;
