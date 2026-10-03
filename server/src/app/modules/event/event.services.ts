import prisma from '@/app/configs/db.configs';
import {
  ICreateEventService,
  IUpdateEventService,
  IGetEventListService,
  IGetEventDetailService,
} from '@/app/modules/event/event.types';
import { TEventListQueryForAdmin } from '@/app/modules/event/event.schema';
import { ILightweightExploreItem } from '@/app/modules/explore/explore.types';
import { Event, Prisma } from '@prisma/client';
import { getSystemQueue } from '@/app/queues/system/system.queue';
import { getEmailQueue } from '@/app/queues/email/email.queue';
import { QUEUE_JOBS } from '@/const';
import { sendPushNotification, getUsersNearby } from '@/app/modules/notification/notification.helpers';

/**
 * Service for creating an Event.
 * Executes a transaction to insert the Event and set its PostGIS geography.
 * @returns Promise<Event>
 */
export const createEventService = async ({
  userId,
  payload,
}: ICreateEventService): Promise<Event> => {
  const event = await prisma.$transaction(async (tx) => {
    // 1. Create the Event record
    const newEvent = await tx.event.create({
      data: {
        ...payload,
        userId,
      },
    });

    // 2. Set the PostGIS geography point using raw SQL
    await tx.$executeRaw`
      UPDATE "Event" 
      SET geog = ST_SetSRID(ST_MakePoint(${payload.lng}, ${payload.lat}), 4326)::geography 
      WHERE id = ${newEvent.id}
    `;

    return newEvent;
  });

  // 3. Dispatch delayed jobs for status updates
  const systemQueue = getSystemQueue();
  
  // Job to mark as ONGOING
  const startDelay = new Date(event.startAt).getTime() - Date.now();
  if (startDelay > 0) {
    await systemQueue.add(QUEUE_JOBS.MAKE_EVENT_ONGOING, { eventId: event.id }, { delay: startDelay });
  } else {
    await systemQueue.add(QUEUE_JOBS.MAKE_EVENT_ONGOING, { eventId: event.id });
  }

  // Job to mark as COMPLETED
  const endDelay = new Date(event.endAt).getTime() - Date.now();
  if (endDelay > 0) {
    await systemQueue.add(QUEUE_JOBS.MAKE_EVENT_COMPLETED, { eventId: event.id }, { delay: endDelay });
  } else {
    await systemQueue.add(QUEUE_JOBS.MAKE_EVENT_COMPLETED, { eventId: event.id });
  }

  // 4. Notify nearby users (5 km radius)
  try {
    const nearbyUserIds = await getUsersNearby({
      lat: event.lat,
      lng: event.lng,
      radiusKm: 5,
      excludeUserId: userId, // Don't notify the creator
    });

    if (nearbyUserIds.length > 0) {
      // Fan out in chunks of 500 to keep BullMQ payloads manageable
      const CHUNK = 500;
      for (let i = 0; i < nearbyUserIds.length; i += CHUNK) {
        const chunk = nearbyUserIds.slice(i, i + CHUNK);
        await sendPushNotification({
          userIds: chunk,
          notificationType: 'NEW_EVENT',
          title: 'New Event Near You! 🎉',
          description: `'${event.eventName}' is happening nearby on ${new Date(event.startAt).toLocaleDateString()}.`,
          metaData: { eventId: event.id },
        });
        await sendPushNotification({
          userIds: chunk,
          notificationType: 'NEW_EVENT_NEARBY',
          title: 'Event Nearby 📍',
          description: `A new event '${event.eventName}' is taking place within 5 km of you!`,
          metaData: { eventId: event.id },
        });
      }
    }
  } catch (notifyErr) {
    // WHY: Notification failure must never break the event creation response.
    const { default: logger } = await import('@/app/configs/logger.configs');
    logger.error('[createEventService] Failed to send nearby notifications', notifyErr);
  }

  return event;
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
            buyerUserId: order.buyerUserId,
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

        await sendPushNotification({
          userIds: [emailData.buyerUserId],
          notificationType: 'EVENT_CANCELED',
          title: 'Event Canceled',
          description: `The event '${emailData.eventName}' has been canceled. Your refund of ${emailData.refundAmount} ${emailData.refundCurrency.toUpperCase()} is scheduled for ${emailData.refundScheduledFor}.`,
          metaData: { eventId: updatedEvent.id, orderId: emailData.orderId }
        });
      }

      // Notify the owner
      await sendPushNotification({
        userIds: [userId],
        notificationType: 'EVENT_CANCELED_SUCCESS',
        title: 'Event Canceled Successfully',
        description: `Your event '${updatedEvent.eventName}' was canceled and ${createdRefunds.length} refunds have been scheduled.`,
        metaData: { eventId: updatedEvent.id }
      });
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

  const where: Prisma.EventWhereInput = { userId };
  if (eventStatus !== undefined) {
    where.eventStatus = eventStatus;
  }
  if (eventStatus === 'UPCOMING') {
    where.endAt = { gt: new Date() };
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
      include: {
        wishlists: {
          where: { userId },
          select: { id: true },
        },
      }
    }),
  ]);

  const mappedData: ILightweightExploreItem[] = data.map((evt) => ({
    id: evt.id,
    name: evt.eventName,
    lat: evt.lat,
    lng: evt.lng,
    location: evt.location,
    type: 'EVENT',
    thumbnail: evt.thumbnail,
    price: Number(evt.eventPrice),
    currency: evt.currency,
    isWishlist: evt.wishlists.length > 0,
  }));

  return { data: mappedData, total };
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

/**
 * This service is used by admin to retrieve all events.
 * @returns 
 */
export const retrieveEventsForAdminService = async ({
  query,
}: {
  query: TEventListQueryForAdmin;
}) => {
  try {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const eventStatus = query.eventStatus;
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.EventWhereInput = {};
    if (eventStatus) {
      whereCondition.eventStatus = eventStatus;
    }

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.event.count({ where: whereCondition }),
    ]);

    const data = events.map((event) => {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const d = event.startAt;
      let hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const dateAndTime = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}, ${hours}:${minutes} ${ampm}`;

      return {
        id: event.id,
        name: event.eventName,
        description: event.eventDescription,
        thumbnail: event.thumbnail,
        images: event.images,
        dateAndTime,
        table: event.dressCode || '-',
        country: event.location,
        price: Number(event.eventPrice) || 0,
        currency: event.currency || 'USD',
        eventStatus: event.eventStatus,
        createdAt: event.createdAt,
      };
    });

    return { data, total, page, limit };
  } catch (error) {
    throw error;
  }
};
