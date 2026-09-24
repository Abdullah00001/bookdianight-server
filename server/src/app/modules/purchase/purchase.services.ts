import { Prisma, Service } from '@prisma/client';
import prisma from '@/app/configs/db.configs';
import {
  parseFixedCstWallClock,
} from '@/app/modules/purchase/purchase.helpers';
import {
  IClubAvailabilityService,
  IClubPurchaseResult,
  ICreateClubPurchaseService,
  ICreateEventPurchaseService,
  IEventPurchaseResult,
} from '@/app/modules/purchase/purchase.types';
import { getSystemQueue } from '@/app/queues/system/system.queue';
import { QUEUE_JOBS } from '@/const';
import { IExpireClubBookingHold } from '@/app/queues/system/system.types';

/**
 * Reads the active Club booking that overlaps an already-validated fixed-CST
 * interval. The controller owns the buyer-facing availability-state response.
 * @param query Validated Club availability query.
 * @returns The overlapping active booking, or null when the interval is free.
 */
export const getClubPurchaseAvailabilityService = async ({
  query,
}: IClubAvailabilityService) => {
  try {
    // The project persists fixed-CST wall-clock values as timestamps. Preserve
    // the submitted -06:00 clock fields rather than using host-local time.
    const startAt = parseFixedCstWallClock(query.startAt);
    const endAt = parseFixedCstWallClock(query.endAt);

    const realNow = new Date();

    return await prisma.clubBooking.findFirst({
      where: {
        clubPackageId: query.clubPackageId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        OR: [
          { status: 'BOOKED' },
          { status: 'HOLD', holdExpiresAt: { gt: realNow } },
        ],
      },
      include: { order: true },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Persists the pending Club Order and ten-minute table Hold. Middleware has
 * already validated the buyer, package, interval, capacity, opening hours, and
 * request idempotency input. Returns domain records only for controller use.
 * @param userId Authenticated buyer identifier.
 * @param payload Validated Club purchase payload.
 * @param idempotencyKey Validated buyer-scoped idempotency key.
 * @returns Persisted Order and ClubBooking with replay information.
 */
export const createClubPurchaseService = async ({
  userId,
  payload,
  idempotencyKey,
}: ICreateClubPurchaseService): Promise<IClubPurchaseResult> => {
  try {
    const startAt = parseFixedCstWallClock(payload.startAt);
    const endAt = parseFixedCstWallClock(payload.endAt);
    const existingOrder = await prisma.order.findUnique({
      where: {
        buyerUserId_idempotencyKey: { buyerUserId: userId, idempotencyKey },
      },
      include: { clubBooking: true },
    });

    // The durable unique buyer/key pair is the replay record. Middleware owns
    // request-equivalence checks; this branch only returns persisted records.
    if (existingOrder?.clubBooking) {
      return {
        order: existingOrder,
        booking: existingOrder.clubBooking,
        replayed: true,
      };
    }

    const realNow = new Date();
    const result = await prisma.$transaction(
      async (tx) => {
        // Expiry time alone does not release PostgreSQL's active HOLD/BOOKED
        // exclusion constraint. Persist EXPIRED before acquiring another Hold.
        await tx.clubBooking.updateMany({
          where: {
            clubPackageId: payload.clubPackageId,
            status: 'HOLD',
            holdExpiresAt: { lte: realNow },
          },
          data: { status: 'EXPIRED' },
        });

        // These transaction reads provide values for persistence. Middleware
        // has already handled all client-facing purchasability validation.
        const clubPackage = await tx.clubPackage.findUniqueOrThrow({
          where: { id: payload.clubPackageId },
          include: { club: true },
        });
        const buyer = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          include: { profile: true },
        });
        const commission = await tx.applicationCharge.findUniqueOrThrow({
          where: { serviceType: Service.CLUB },
        });
        const serviceCharge = await tx.serviceCharge.findUniqueOrThrow({
          where: { id: 'GLOBAL' },
        });

        // Snapshot commercial values before Order insertion; later package and
        // configuration edits cannot alter this immutable financial history.
        const grossAmount = clubPackage.price;
        const serviceChargeAmount = serviceCharge.amount;
        const buyerTotal = grossAmount.add(serviceChargeAmount);
        const commissionRate = commission.chargePercentage;
        const commissionAmount = grossAmount
          .mul(commissionRate)
          .div(100)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const sellerEarnings = grossAmount.sub(commissionAmount);

        // A payment-ready Order and its table claim are only useful together,
        // so they are written inside the same serializable transaction.
        const order = await tx.order.create({
          data: {
            buyerUserId: userId,
            sellerUserId: clubPackage.club.userId,
            serviceType: Service.CLUB,
            idempotencyKey,
            buyerName: buyer.name,
            buyerPhoneNumber: buyer.phoneNumber,
            buyerDateOfBirth: buyer.profile?.dateOfBirth,
            buyerGender: buyer.profile?.gender,
            buyerImage: buyer.profile?.profileAvatar,
            grossAmount,
            serviceChargeAmount,
            buyerTotal,
            commissionRate,
            commissionAmount,
            sellerEarnings,
            currency: clubPackage.currency,
          },
        });
        const booking = await tx.clubBooking.create({
          data: {
            orderId: order.id,
            clubId: clubPackage.clubId,
            clubPackageId: clubPackage.id,
            startAt,
            endAt,
            // The booking Hold expires 10 minutes from the real current instant;
            // fixed CST wall-clock conversion is for business-time values and
            // must not be used as the expiration base.
            holdExpiresAt: new Date(realNow.getTime() + 10 * 60 * 1000),
            guestCount: payload.guestCount,
            clubName: clubPackage.club.name,
            clubLocation: clubPackage.club.location,
            packageName: clubPackage.name,
            packageCapacity: clubPackage.capacity,
          },
        });
        return { order, booking, replayed: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    // Schedule delayed expiration job strictly AFTER the database transaction commits.
    // The hold logic runs 10 minutes from now. We override job attempts to allow grace period retries.
    // Fixed backoff of 1 minute allows up to 5 additional retries (for max 15m lifetime).
    if (!result.replayed) {
      const payload: IExpireClubBookingHold = { bookingId: result.booking.id };
      await getSystemQueue().add(
        QUEUE_JOBS.EXPIRE_CLUB_BOOKING_HOLD,
        payload,
        {
          jobId: result.booking.id,
          delay: 10 * 60 * 1000,
          attempts: 6,
          backoff: { type: 'fixed', delay: 60 * 1000 },
        }
      );
    }

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Persists a pending Event Order, immutable EventPurchase snapshot, and all
 * attendee snapshots. Middleware owns Event/profile/age prerequisites; this
 * service performs the final atomic persistence and returns domain records.
 * @param userId Authenticated buyer identifier.
 * @param payload Validated Event purchase payload.
 * @param idempotencyKey Validated buyer-scoped idempotency key.
 * @returns Persisted Order, EventPurchase, attendees, and replay information.
 */
export const createEventPurchaseService = async ({
  userId,
  payload,
  idempotencyKey,
  buyerAge,
}: ICreateEventPurchaseService): Promise<IEventPurchaseResult> => {
  try {
    const existingOrder = await prisma.order.findUnique({
      where: {
        buyerUserId_idempotencyKey: { buyerUserId: userId, idempotencyKey },
      },
      include: { eventPurchase: { include: { attendees: true } } },
    });
    if (existingOrder?.eventPurchase) {
      return {
        order: existingOrder,
        eventPurchase: existingOrder.eventPurchase,
        attendees: existingOrder.eventPurchase.attendees,
        replayed: true,
      };
    }

    return await prisma.$transaction(
      async (tx) => {
        const event = await tx.event.findUniqueOrThrow({
          where: { id: payload.eventId },
        });
        const buyer = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          include: { profile: true },
        });
        const commission = await tx.applicationCharge.findUniqueOrThrow({
          where: { serviceType: Service.EVENT },
        });
        const serviceCharge = await tx.serviceCharge.findUniqueOrThrow({
          where: { id: 'GLOBAL' },
        });

        // Buyer identity and age are server-derived snapshots; the Flutter
        // client cannot provide or later alter ticket/PDF history fields.
        const personCount = payload.friends.length + 1;
        const grossAmount = event.eventPrice.mul(personCount);
        const serviceChargeAmount = serviceCharge.amount;
        const buyerTotal = grossAmount.add(serviceChargeAmount);
        const commissionRate = commission.chargePercentage;
        const commissionAmount = grossAmount
          .mul(commissionRate)
          .div(100)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const sellerEarnings = grossAmount.sub(commissionAmount);

        // One transaction prevents partial ticket history and snapshots the
        // commercial terms before later Event, profile, or config edits.
        const order = await tx.order.create({
          data: {
            buyerUserId: userId,
            sellerUserId: event.userId,
            serviceType: Service.EVENT,
            idempotencyKey,
            buyerName: buyer.name,
            buyerPhoneNumber: buyer.phoneNumber,
            buyerDateOfBirth: buyer.profile!.dateOfBirth,
            buyerGender: buyer.profile!.gender,
            buyerImage: buyer.profile!.profileAvatar,
            grossAmount,
            serviceChargeAmount,
            buyerTotal,
            commissionRate,
            commissionAmount,
            sellerEarnings,
            currency: event.currency,
          },
        });
        const eventPurchase = await tx.eventPurchase.create({
          data: {
            orderId: order.id,
            eventId: event.id,
            personCount,
            eventName: event.eventName,
            eventLocation: event.location,
            eventStartAt: event.startAt,
            eventEndAt: event.endAt,
            pricePerPerson: event.eventPrice,
            // This is based on the immutable EventPurchase start snapshot so
            // UI and future workers are insulated from live Event edits.
            transferEligibleAt: new Date(
              event.startAt.getTime() - 6 * 60 * 60 * 1000
            ),
          },
        });
        await tx.eventPurchaseAttendee.createMany({
          data: [
            {
              eventPurchaseId: eventPurchase.id,
              attendeeType: 'BUYER',
              position: 1,
              name: buyer.name,
              phoneNumber: buyer.phoneNumber,
              gender: buyer.profile!.gender,
              age: buyerAge,
              image: buyer.profile!.profileAvatar,
            },
            ...payload.friends.map((friend, index) => ({
              eventPurchaseId: eventPurchase.id,
              attendeeType: 'FRIEND' as const,
              position: index + 2,
              ...friend,
            })),
          ],
        });
        const attendees = await tx.eventPurchaseAttendee.findMany({
          where: { eventPurchaseId: eventPurchase.id },
          orderBy: { position: 'asc' },
        });
        return { order, eventPurchase, attendees, replayed: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    throw error;
  }
};
