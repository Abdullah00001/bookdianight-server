import { ICronJob } from '@/app/@types/job.types';

import { getNotificationQueue } from '@/app/queues/notification/notification.queue';
import { ISendFcmNotification } from '@/app/queues/notification/notification.types';
import { QUEUE_JOBS } from '@/const';
import { NotificationType } from '@prisma/client';
import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';

const dispatchremindersJob: ICronJob = {
  name: 'dispatchReminders',
  schedule: '0 * * * *', // Run exactly at the top of every hour
  execute: async () => {
    logger.info('[dispatchReminders] Starting hourly reminder checks...');
    const now = new Date();
    // Look for events/bookings in the 24-25 hour window
    const targetStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const targetEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // 1. EVENT REMINDERS
    const upcomingEvents = await prisma.eventPurchase.findMany({
      where: {
        eventStartAt: {
          gte: targetStart,
          lt: targetEnd,
        },
        order: {
          status: 'PAID',
        },
      },
      include: {
        order: true,
      },
    });

    for (const purchase of upcomingEvents) {
      const payload: ISendFcmNotification = {
        userIds: [purchase.order.buyerUserId],
        notificationType: NotificationType.EVENT_REMINDER,
        title: 'Upcoming Event Reminder',
        description: `Your event '${purchase.eventName}' is starting in 24 hours!`,
        metaData: { eventId: purchase.eventId, eventPurchaseId: purchase.id },
      };

      await getNotificationQueue().add(
        QUEUE_JOBS.SEND_FCM_NOTIFICATION,
        payload,
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
    }

    // 2. CLUB BOOKING REMINDERS
    const upcomingClubBookings = await prisma.clubBooking.findMany({
      where: {
        startAt: {
          gte: targetStart,
          lt: targetEnd,
        },
        status: 'BOOKED',
        order: {
          status: 'PAID',
        },
      },
      include: {
        order: true,
      },
    });

    for (const booking of upcomingClubBookings) {
      const payload: ISendFcmNotification = {
        userIds: [booking.order.buyerUserId],
        notificationType: NotificationType.CLUB_BOOKING_REMINDER,
        title: 'Club Booking Reminder',
        description: `Your booking at '${booking.clubName}' is tonight!`,
        metaData: { clubId: booking.clubId, clubBookingId: booking.id },
      };

      await getNotificationQueue().add(
        QUEUE_JOBS.SEND_FCM_NOTIFICATION,
        payload,
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
      );
    }

    // 3. WISHLIST EVENT REMINDERS
    const wishlistedEvents = await prisma.event.findMany({
      where: {
        startAt: {
          gte: targetStart,
          lt: targetEnd,
        },
        eventStatus: 'UPCOMING',
      },
      include: {
        wishlists: { select: { userId: true } },
      },
    });

    for (const event of wishlistedEvents) {
      const userIds = event.wishlists.map((w) => w.userId);
      if (userIds.length > 0) {
        const payload: ISendFcmNotification = {
          userIds,
          notificationType: NotificationType.WISHLIST_EVENT_REMINDER,
          title: 'Wishlisted Event Approaching',
          description: `The event '${event.eventName}' from your wishlist starts tomorrow!`,
          metaData: { eventId: event.id },
        };

        await getNotificationQueue().add(
          QUEUE_JOBS.SEND_FCM_NOTIFICATION,
          payload,
          { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
        );
      }
    }

    logger.info(`[dispatchReminders] Successfully queued reminders.`);
  },
};

export default dispatchremindersJob;
