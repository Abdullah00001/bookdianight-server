import { NextFunction, Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import prisma from '@/app/configs/db.configs';
import {
  calculateAge,
  currentFixedCstWallClock,
  parseFixedCstWallClock,
} from '@/app/modules/purchase/purchase.helpers';
import { getClubPurchaseAvailabilityService } from '@/app/modules/purchase/purchase.services';

/**
 * This middleware validates and attaches the idempotency key to the request.
 * An idempotency key is a unique identifier that is used to prevent duplicate requests.
 * If the idempotency key is already used, the request will be rejected.
 * @param req Request
 * @param res Response
 * @param next Next function
 * @returns Promise<void>
 */
export const requirePurchaseIdempotencyKeyMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.header('Idempotency-Key');
    if (!key || key.length > 255) {
      res.status(422).json({
        success: false,
        message:
          'Idempotency-Key header is required and must not exceed 255 characters',
        traceId: getTraceId(),
      });
      return;
    }
    req.purchaseIdempotencyKey = key;
    next();
  }
);

/**
 * This middleware validates and attaches the club package to the request.
 * If the club package is not found or unavailable, the request will be rejected.
 * @param req Request
 * @param res Response
 * @param next Next function
 * @returns Promise<void>
 */
export const checkPurchasableClubPackageMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clubPackageId =
      (req.validatedQuery as { clubPackageId?: string } | undefined)
        ?.clubPackageId ??
      (req.body as { clubPackageId?: string }).clubPackageId;
    const packageRecord = clubPackageId
      ? await prisma.clubPackage.findUnique({
          where: { id: clubPackageId },
          include: { club: { include: { clubOpeningHours: true } } },
        })
      : null;
    if (
      !packageRecord ||
      packageRecord.club.deactivatedAt ||
      !packageRecord.isActive
    ) {
      res
        .status(404)
        .json({
          success: false,
          message: 'Club package not found or unavailable',
          traceId: getTraceId(),
        });
      return;
    }
    req.purchaseClubPackage = packageRecord;
    next();
  }
);

/** Resolves active UPCOMING Event context before purchase processing. */
export const checkPurchasableEventMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const event = await prisma.event.findUnique({
      where: { id: (req.body as { eventId: string }).eventId },
    });
    if (!event || event.deactivatedAt || event.eventStatus !== 'UPCOMING') {
      res
        .status(404)
        .json({
          success: false,
          message: 'Event not found or unavailable',
          traceId: getTraceId(),
        });
      return;
    }
    req.purchaseEvent = event;
    next();
  }
);

/**
 * Establishes the server-derived buyer-age snapshot before Event persistence.
 * The client never supplies buyer age, and an incomplete Profile is a
 * client-facing prerequisite rather than a service-layer failure.
 */
export const checkEventPurchaseBuyerProfileMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const buyer = await prisma.user.findUnique({
      where: { id: (req.user as { id: string }).id },
      include: { profile: true },
    });
    const dateOfBirth = buyer?.profile?.dateOfBirth;
    if (!dateOfBirth) {
      res.status(422).json({
        success: false,
        message: 'A buyer date of birth is required to purchase an Event',
        traceId: getTraceId(),
      });
      return;
    }
    const age = calculateAge(dateOfBirth, currentFixedCstWallClock());
    if (age <= 0) {
      res.status(422).json({
        success: false,
        message: 'Buyer age is invalid',
        traceId: getTraceId(),
      });
      return;
    }
    req.purchaseBuyerAge = age;
    next();
  }
);

/**
 * Rejects reuse of a buyer-scoped idempotency key for a different Club request.
 * The service can then safely treat an existing matching Order as a replay.
 */
export const checkClubPurchaseIdempotencyMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const payload = req.body as {
      clubPackageId: string;
      startAt: string;
      endAt: string;
      guestCount: number;
    };
    const existingOrder = await prisma.order.findUnique({
      where: {
        buyerUserId_idempotencyKey: {
          buyerUserId: (req.user as { id: string }).id,
          idempotencyKey: req.purchaseIdempotencyKey,
        },
      },
      include: { clubBooking: true },
    });
    if (!existingOrder) return next();

    const booking = existingOrder.clubBooking;
    const requestMatchesBooking =
      booking &&
      booking.clubPackageId === payload.clubPackageId &&
      booking.startAt.getTime() === parseFixedCstWallClock(payload.startAt).getTime() &&
      booking.endAt.getTime() === parseFixedCstWallClock(payload.endAt).getTime() &&
      booking.guestCount === payload.guestCount;
    if (requestMatchesBooking) return next();

    res.status(409).json({
      success: false,
      message: 'Idempotency-Key has already been used for a different purchase',
      traceId: getTraceId(),
    });
  }
);

/**
 * Rejects reuse of a buyer-scoped idempotency key for a different Event request.
 * Attendee snapshots are compared in request order, which maps to their stored
 * immutable attendee positions.
 */
export const checkEventPurchaseIdempotencyMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const payload = req.body as {
      eventId: string;
      friends: Array<{
        name: string;
        phoneNumber: string;
        gender: string;
        age: number;
        image?: string;
      }>;
    };
    const existingOrder = await prisma.order.findUnique({
      where: {
        buyerUserId_idempotencyKey: {
          buyerUserId: (req.user as { id: string }).id,
          idempotencyKey: req.purchaseIdempotencyKey,
        },
      },
      include: { eventPurchase: { include: { attendees: true } } },
    });
    if (!existingOrder) return next();

    const eventPurchase = existingOrder.eventPurchase;
    const friends = eventPurchase?.attendees
      .filter((attendee) => attendee.attendeeType === 'FRIEND')
      .sort((left, right) => left.position - right.position);
    const requestMatchesPurchase =
      eventPurchase?.eventId === payload.eventId &&
      friends?.length === payload.friends.length &&
      friends?.every((friend, index) => {
        const requestedFriend = payload.friends[index];
        return (
          friend.name === requestedFriend.name &&
          friend.phoneNumber === requestedFriend.phoneNumber &&
          friend.gender === requestedFriend.gender &&
          friend.age === requestedFriend.age &&
          friend.image === (requestedFriend.image ?? null)
        );
      });
    if (requestMatchesPurchase) return next();

    res.status(409).json({
      success: false,
      message: 'Idempotency-Key has already been used for a different purchase',
      traceId: getTraceId(),
    });
  }
);

/**
 * Checks for overlapping active Club bookings (HOLD or BOOKED) before proceeding with a purchase.
 * Prevents Prisma 23P01 exclusion constraint violations by rejecting conflicts at the middleware layer.
 * Allows safe replays if the conflicting booking belongs to the same user and idempotency key.
 */
export const checkClubPurchaseAvailabilityMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const payload = req.body as {
      clubPackageId: string;
      startAt: string;
      endAt: string;
      guestCount: number;
    };

    const conflictingBooking = await getClubPurchaseAvailabilityService({
      userId: (req.user as { id: string }).id,
      query: payload,
    });

    if (conflictingBooking) {
      if (
        conflictingBooking.order.buyerUserId === (req.user as { id: string }).id &&
        conflictingBooking.order.idempotencyKey === req.purchaseIdempotencyKey
      ) {
        // This is a replay of the same successful purchase, so allow it to proceed
        return next();
      }

      res.status(409).json({
        success: false,
        message: 'The requested time interval is already booked or held by someone else.',
        traceId: getTraceId(),
      });
      return;
    }

    next();
  }
);
