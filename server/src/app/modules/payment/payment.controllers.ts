import { Request, Response } from 'express';
import { asyncHandler } from '@/app/utils/system.utils';
import { createPaymentIntentService } from '@/app/modules/payment/payment.services';
import { processPaymentWebhookService } from '@/app/modules/payment/payment.webhook.services';

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

/**
 * Receives a signature-verified Stripe Payment webhook payload.
 *
 * WHY RAW BODY: We bypass JSON parsing in `app.ts` because Stripe requires the exact raw payload string to verify the cryptographic signature.
 * WHY AUTHORITATIVE: This controller delegates to a service that is the ONLY trusted actor to finalize a payment state (succeeded or failed), protecting the system from client-side spoofing.
 */
export const paymentWebhookController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await processPaymentWebhookService({
      payload: req.body,
      signature: req.header('stripe-signature'),
    });
    res.status(200).json({ received: true });
  }
);
