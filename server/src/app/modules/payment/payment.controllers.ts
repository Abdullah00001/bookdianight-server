import { Request, Response } from 'express';
import { asyncHandler } from '@/app/utils/system.utils';
import { createPaymentIntentService } from '@/app/modules/payment/payment.services';

/**
 * Controller for initializing payment for an existing Order.
 * Constructs the client-facing success response containing the Stripe clientSecret.
 */
export const createPaymentIntentController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await createPaymentIntentService({
      userId: (req.user as { id: string }).id,
      order: (req as any).paymentOrder,
      idempotencyKey: (req as any).paymentIdempotencyKey,
    });

    res.status(result.replayed ? 200 : 201).json({
      success: true,
      message: result.replayed
        ? 'Payment initialization retrieved successfully'
        : 'Payment initialization successful',
      data: {
        clientSecret: result.clientSecret,
        transactionId: result.transaction.id,
        orderId: result.transaction.orderId,
      },
    });
  }
);
