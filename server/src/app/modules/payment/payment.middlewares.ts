import { NextFunction, Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import prisma from '@/app/configs/db.configs';

/**
 * Validates and attaches the payment idempotency key to the request.
 * Required for deterministic PaymentIntent creation per Order.
 */
export const requirePaymentIdempotencyKeyMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.header('Idempotency-Key');
    if (!key || key.length > 255) {
      res.status(422).json({
        success: false,
        message: 'Idempotency-Key header is required and must not exceed 255 characters',
        traceId: getTraceId(),
      });
      return;
    }
    // We attach it dynamically to the request object
    (req as any).paymentIdempotencyKey = key;
    next();
  }
);

/**
 * Validates the Order for payment initialization.
 * Ensures the order exists, belongs to the buyer, is in a valid state (PENDING_PAYMENT),
 * and has a valid purchase relationship (ClubBooking or EventPurchase).
 */
export const checkPaymentOrderValidityMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { orderId } = req.body as { orderId: string };
    const buyerUserId = (req.user as { id: string }).id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        clubBooking: true,
        eventPurchase: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Order not found',
        traceId: getTraceId(),
      });
      return;
    }

    if (order.buyerUserId !== buyerUserId) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to pay for this order',
        traceId: getTraceId(),
      });
      return;
    }

    if (order.status !== 'PENDING_PAYMENT') {
      res.status(409).json({
        success: false,
        message: `Order cannot be initialized for payment in state: ${order.status}`,
        traceId: getTraceId(),
      });
      return;
    }

    if (!order.clubBooking && !order.eventPurchase) {
      res.status(422).json({
        success: false,
        message: 'Order is missing a valid purchase relationship',
        traceId: getTraceId(),
      });
      return;
    }

    (req as any).paymentOrder = order;
    next();
  }
);
