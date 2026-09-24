import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import {
  createClubPurchaseService,
  createEventPurchaseService,
  getClubPurchaseAvailabilityService,
} from '@/app/modules/purchase/purchase.services';
import {
  TClubAvailabilityQuery,
  TCreateClubPurchasePayload,
  TCreateEventPurchasePayload,
} from '@/app/modules/purchase/purchase.schema';

/**
 * This controller is used to get the availability of a club package.
 * It calls the getClubPurchaseAvailabilityService which returns the availability of the club package.
 * and returns the availability of the club package.
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getClubPurchaseAvailabilityController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as User;
    const query = req.validatedQuery as TClubAvailabilityQuery;
    const traceId = getTraceId();

    // Call the service to get the availability of the club package.
    const booking = await getClubPurchaseAvailabilityService({
      userId: user.id,
      query,
    });
    // Check if the booking is own hold
    const ownHold =
      booking?.status === 'HOLD' && booking.order.buyerUserId === user.id;
    
    // Return the availability of the club package.
    res.status(200).json({
      success: true,
      message: 'Club availability retrieved successfully',
      data: {
        state: !booking
          ? 'AVAILABLE'
          : booking.status === 'BOOKED'
            ? 'BOOKED'
            : ownHold
              ? 'HELD'
              : 'UNAVAILABLE',
        ...(ownHold
          ? { bookingId: booking.id, holdExpiresAt: booking.holdExpiresAt }
          : {}),
      },
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to create a club purchase.
 * It calls the createClubPurchaseService which returns the created club purchase.
 * and returns the created club purchase.
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const createClubPurchaseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as User;
    const payload = req.body as TCreateClubPurchasePayload;
    const idempotencyKey = req.purchaseIdempotencyKey;
    const traceId = getTraceId();

    // Call the service to create a club purchase.
    const result = await createClubPurchaseService({
      userId: user.id,
      payload,
      idempotencyKey,
    });

    // Return the created or replayed club purchase.
    res.status(result.replayed ? 200 : 201).json({
      success: true,
      message: result.replayed
        ? 'Club purchase retrieved successfully'
        : 'Club purchase created successfully',
      data: { order: result.order, booking: result.booking },
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to create an event purchase.
 * It calls the createClubPurchaseService which returns the created club purchase.
 * and returns the created club purchase.
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const createEventPurchaseController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as User;
    const payload = req.body as TCreateEventPurchasePayload;
    const idempotencyKey = req.purchaseIdempotencyKey;
    const buyerAge = req.purchaseBuyerAge!;
    const traceId = getTraceId();

    // Call the service to create an event purchase.
    const result = await createEventPurchaseService({
      userId: user.id,
      payload,
      idempotencyKey,
      buyerAge,
    });

    // Return the created or replayed event purchase.
    res.status(result.replayed ? 200 : 201).json({
      success: true,
      message: result.replayed
        ? 'Event purchase retrieved successfully'
        : 'Event purchase created successfully',
      data: {
        order: result.order,
        eventPurchase: result.eventPurchase,
        attendees: result.attendees,
      },
      traceId,
    });
    return;
  }
);
