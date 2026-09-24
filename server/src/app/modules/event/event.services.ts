import prisma from '@/app/configs/db.configs';
import {
  ICreateEventService,
  IUpdateEventService,
  IGetEventListService,
  IGetEventDetailService,
} from '@/app/modules/event/event.types';
import { Event } from '@prisma/client';
import { getSystemQueue } from '@/app/queues/system/system.queue';
import { getEmailQueue } from '@/app/queues/email/email.queue';
import { QUEUE_JOBS } from '@/const';

/**
 * Service for creating an Event.
 * Executes a transaction to insert the Event and set its PostGIS geography.
 * @returns Promise<Event>
 */
export const createEventService = async ({
  userId,
  payload,
}: ICreateEventService): Promise<Event> => {
  return await prisma.$transaction(async (tx) => {
    // 1. Create the Event record
    const event = await tx.event.create({
      data: {
        ...payload,
        userId,
      },
    });

    // 2. Set the PostGIS geography point using raw SQL
    await tx.$executeRaw`
      UPDATE "Event" 
      SET geog = ST_SetSRID(ST_MakePoint(${payload.lng}, ${payload.lat}), 4326)::geography 
      WHERE id = ${event.id}
    `;

    return event;
  });
};

/**
 * Service for updating an Event.
 * Validates ownership, updates the Event, and updates the PostGIS geography if location changed.
 * Also handles implicit logical deactivation.
 * @returns Promise<Event>
 */
export const updateEventService = async ({
  eventId,
  userId,
  payload,
  trustedCancellationContext,
}: IUpdateEventService): Promise<Event> => {
  const { isActive, ...eventData } = payload;

  // Ownership verification is handled by middleware fetching or we can double check, but middleware already checked it.
  if (!trustedCancellationContext) {
    // Fallback if somehow not populated (e.g. testing)
    await prisma.event.findUniqueOrThrow({
      where: { id: eventId, userId },
    });
  }

  // Extract trusted context
  const isCancellation = trustedCancellationContext?.isCancellation || false;
  const cancellationTimestamp =
    trustedCancellationContext?.cancellationTimestamp;

  let deactivatedAt: Date | null | undefined = undefined;

  if (isCancellation) {
    // WHY: Override isActive payload to force deactivation.
    deactivatedAt = cancellationTimestamp;
  } else {
    // Normal edit flow
    if (isActive === false) {
      deactivatedAt = new Date();
    } else if (isActive === true) {
      deactivatedAt = null;
    }
  }

  let createdRefunds: { refundId: string; scheduledFor: Date }[] = [];
  let createdEmails: any[] = [];

  try {
    const updatedEvent = await prisma.$transaction(async (tx) => {
      // 1. Update the Event record
      const eventToReturn = await tx.event.update({
        where: { id: eventId },
        data: {
          ...eventData,
          ...(deactivatedAt !== undefined && { deactivatedAt }),
        },
      });

      // 2. Update PostGIS geography point if lat/lng changed
      if (eventData.lat !== undefined && eventData.lng !== undefined) {
        await tx.$executeRaw`
          UPDATE "Event"
          SET geog = ST_SetSRID(ST_MakePoint(${eventData.lng}, ${eventData.lat}), 4326)::geography
          WHERE id = ${eventId}
        `;
      }

      // 3. If this is a formal cancellation, generate Refund records for all PAID Orders
      if (isCancellation) {
        // Find all paid Event Orders for this event
        const paidOrders = await tx.order.findMany({
          where: {
            serviceType: 'EVENT',
            status: 'PAID',
            eventPurchase: {
              eventId: eventId,
            },
          },
          include: {
            buyer: true,
          },
        });

        const scheduledFor = new Date(
          cancellationTimestamp.getTime() + 6 * 24 * 60 * 60 * 1000
        );

        for (const order of paidOrders) {
          // WHY: Refund amount is grossAmount, retaining the service charge.
          // WHY: One scheduled Refund record per Order.
          const refund = await tx.refund.create({
            data: {
              orderId: order.id,
              amount: order.grossAmount,
              currency: order.currency,
              status: 'SCHEDULED',
              scheduledFor,
              idempotencyKey: `refund-${order.id}-${cancellationTimestamp.getTime()}`,
            },
          });

          createdRefunds.push({
            refundId: refund.id,
            scheduledFor: refund.scheduledFor,
          });

          createdEmails.push({
            orderId: order.id,
            buyerName: order.buyerName,
            buyerEmail: order.buyer.email,
            eventName: eventToReturn.eventName,
            eventLocation: eventToReturn.location,
            eventStartAt: eventToReturn.startAt.toISOString(),
            refundAmount: refund.amount.toFixed(2), // WHY: Exact persisted refund Decimal formatted as a string
            refundCurrency: refund.currency,
            refundScheduledFor: refund.scheduledFor.toISOString(),
            traceId: `cancel-email-${order.id}-${cancellationTimestamp.getTime()}`,
          });
        }
      }

      return eventToReturn;
    });

    // 4. Enqueue background jobs AFTER successful transaction
    if (isCancellation && createdRefunds.length > 0) {
      const systemQueue = getSystemQueue();
      const emailQueue = getEmailQueue();
      for (const refundData of createdRefunds) {
        // WHY: Delay execution until the persisted scheduledFor time
        const delay = Math.max(
          0,
          refundData.scheduledFor.getTime() - Date.now()
        );

        await systemQueue.add(
          QUEUE_JOBS.PROCESS_REFUND,
          { refundId: refundData.refundId },
          {
            jobId: `process-refund-${refundData.refundId}`,
            delay,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
      }

      for (const emailData of createdEmails) {
        // WHY: Enqueued only after Event DB commit successfully so we never email users for failed cancellations.
        await emailQueue.add(
          QUEUE_JOBS.SEND_EVENT_CANCELLATION_EMAIL,
          emailData,
          {
            jobId: `send-cancel-email-${emailData.orderId}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
      }
    }

    return updatedEvent;
  } catch (error) {
    throw error;
  }
};

/**
 * Service for fetching a paginated list of Events belonging to an owner.
 * @returns Promise<{ data: Event[], total: number }>
 */
export const getEventListService = async ({
  userId,
  query,
}: IGetEventListService) => {
  const { page, limit, eventStatus, isActive } = query;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (eventStatus !== undefined) {
    where.eventStatus = eventStatus;
  }
  if (isActive !== undefined) {
    where.deactivatedAt = isActive ? null : { not: null };
  }

  const [total, data] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return { data, total };
};

/**
 * Service for fetching full details of a specific Event belonging to an owner.
 * @returns Promise<Event>
 */
export const getEventDetailService = async ({
  eventId,
  userId,
}: IGetEventDetailService): Promise<Event> => {
  return await prisma.event.findUniqueOrThrow({
    where: { id: eventId, userId },
  });
};
