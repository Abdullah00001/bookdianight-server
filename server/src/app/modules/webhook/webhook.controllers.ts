import { Request, Response } from 'express';
import { asyncHandler } from '@/app/utils/system.utils';
import { processPaymentWebhookService } from '@/app/modules/webhook/webhook.services';

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
