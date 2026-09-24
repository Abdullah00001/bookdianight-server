import { env } from '@/env';
import { stripe } from '@/app/configs/stripe.configs';
import prisma from '@/app/configs/db.configs';

export interface IProcessPaymentWebhookService {
  payload: any;
  signature: string | undefined;
}

/**
 * Validates, deduplicates, and processes Stripe payment webhooks.
 *
 * WHY RAW BODY: Stripe signature validation requires the exact raw bytes to ensure the payload hasn't been tampered with.
 * WHY AUTHORITATIVE: This webhook finalizes the payment in our system, ensuring financial consistency.
 *
 * State Transitions:
 * - payment_intent.succeeded: PaymentTransaction (PAID), Order (PAID), ClubBooking (BOOKED - only if currently HOLD)
 * - payment_intent.payment_failed/canceled: PaymentTransaction (FAILED), Order (PAYMENT_FAILED), ClubBooking (EXPIRED - only if currently HOLD)
 *
 * Duplicate Delivery Handling:
 * Webhooks may be delivered multiple times. We use the WebhookEvent model to track processed Stripe events.
 * A processed event will return early, preventing double state transitions.
 */
export const processPaymentWebhookService = async ({
  payload,
  signature,
}: IProcessPaymentWebhookService): Promise<void> => {
  try {
    if (!signature) throw new Error('Stripe signature is missing');

    // 1. Signature Verification
    // WHY: We must verify that the event originated from Stripe and hasn't been intercepted/modified.
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_PAYMENT_WEBHOOK_SECRET_KEY
    );

    const supportedEvents = new Set([
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
    ]);

    if (!supportedEvents.has(event.type)) {
      return;
    }

    // 2. WebhookEvent Deduplication
    // WHY: Ensures safe idempotent processing. Stripe events can arrive multiple times or concurrently.
    const prior = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (prior?.status === 'PROCESSED') return;

    const record =
      prior ??
      (await prisma.webhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          payload: JSON.stringify(event),
        },
      }));

    try {
      const paymentIntent = event.data.object as any; // Stripe.PaymentIntent
      const stripePaymentIntentId = paymentIntent.id;

      const paymentTx = await prisma.paymentTransaction.findUnique({
        where: { stripePaymentIntentId },
        include: {
          order: {
            include: {
              clubBooking: true,
            },
          },
        },
      });

      if (paymentTx) {
        const { order } = paymentTx;

        // 3. Transaction Boundary
        // WHY: We must atomically update PaymentTransaction, Order, and the associated purchases (e.g. ClubBooking)
        // to maintain an absolutely consistent financial state.
        await prisma.$transaction(async (tx) => {
          // Re-fetch PaymentTransaction inside the transaction lock
          const currentTx = await tx.paymentTransaction.findUnique({
            where: { id: paymentTx.id },
          });

          // WHY GUARD: Never downgrade or modify an already finalized successful/failed payment due to out-of-order webhooks.
          if (!currentTx || currentTx.status !== 'PENDING') {
            return;
          }

          if (event.type === 'payment_intent.succeeded') {
            await tx.paymentTransaction.update({
              where: { id: currentTx.id },
              data: { status: 'PAID' },
            });
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'PAID' },
            });

            // If ClubBooking exists, conditionally update its status
            if (order.clubBooking) {
              const currentBooking = await tx.clubBooking.findUnique({
                where: { id: order.clubBooking.id },
              });

              // WHY GUARD (Club HOLD -> BOOKED):
              // If booking is EXPIRED (e.g., late payment), DO NOT resurrect it to BOOKED.
              // Late successful payments must not forcefully grab back an expired table reservation.
              if (currentBooking && currentBooking.status === 'HOLD') {
                await tx.clubBooking.update({
                  where: { id: currentBooking.id },
                  data: { status: 'BOOKED' },
                });
              }
            }

            // Note: EventPurchase inherently relies on the parent Order's status.
            // Seller transfers are intentionally omitted from this phase.
          } else if (
            event.type === 'payment_intent.payment_failed' ||
            event.type === 'payment_intent.canceled'
          ) {
            await tx.paymentTransaction.update({
              where: { id: currentTx.id },
              data: { status: 'FAILED' },
            });
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'PAYMENT_FAILED' },
            });

            if (order.clubBooking) {
              const currentBooking = await tx.clubBooking.findUnique({
                where: { id: order.clubBooking.id },
              });

              // WHY GUARD (Club HOLD -> EXPIRED):
              // Only expire if currently HOLD. We must never downgrade a BOOKED booking.
              if (currentBooking && currentBooking.status === 'HOLD') {
                await tx.clubBooking.update({
                  where: { id: currentBooking.id },
                  data: { status: 'EXPIRED' },
                });
              }
            }
          }
        });
      }

      await prisma.webhookEvent.update({
        where: { id: record.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    } catch (error) {
      await prisma.webhookEvent.update({
        where: { id: record.id },
        data: { status: 'FAILED' },
      });
      throw error; // Propagate to controller error handler
    }
  } catch (error) {
    throw error;
  }
};
