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
 * This controller returns the packages available in a Club for a requested interval.
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getClubPurchaseAvailabilityController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query = req.validatedQuery as TClubAvailabilityQuery;
    const traceId = getTraceId();

    const availablePackages = await getClubPurchaseAvailabilityService({ query });

    res.status(200).json({
      success: true,
      message: 'Club availability retrieved successfully',
      data: { availablePackages },
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
