import { IJobHandler } from '@/app/@types/queue.types';
import { QUEUE_JOBS } from '@/const';
import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';
import { stripe } from '@/app/configs/stripe.configs';

/**
 * Worker for processing scheduled Refunds via Stripe.
 *
 * WHY THIS WORKER EXISTS:
 * Refunds are delayed (e.g., 6 days) to ensure all related processes or holds settle before transferring money.
 * This worker executes the actual Stripe refund safely and idempotently using DB state.
 *
 * WHY REFUND.AMOUNT IS USED:
 * Refund amount is Order.grossAmount, ensuring the service charge is retained.
 *
 * WHY CURRENT DB STATE IS RECHECKED:
 * Protects against race conditions, early manual execution, or events getting uncanceled.
 *
 * WHY STRIPE IDEMPOTENCY KEY IS REUSED:
 * Reusing the same key generated in Phase 4E ensures that if Stripe succeeds but the DB crashes,
 * BullMQ retrying will just get a successful read from Stripe without double refunding.
 *
 * WHY UNKNOWN STRIPE OUTCOMES MUST REMAIN RETRYABLE:
 * If the Stripe network request times out, it may have succeeded on Stripe's end.
 * Rethrowing preserves BullMQ's retry mechanism which safely resolves the unknown outcome using the idempotency key.
 *
 * WHY SUCCEEDED REFUNDS ARE NO-OP:
 * A duplicate BullMQ delivery or retry of a succeeded job simply returns instead of failing.
 */
const handler: IJobHandler = {
  name: QUEUE_JOBS.PROCESS_REFUND,
  handler: async (data: any) => {
    const { refundId } = data;

    try {
      // 1. Initial Load
      const refund = await prisma.refund.findUnique({
        where: { id: refundId },
      });

      if (!refund) {
        throw new Error(`Refund record ${refundId} not found`);
      }

      // WHY: If already SUCCEEDED, short-circuit safely (no-op)
      if (refund.status === 'SUCCEEDED') {
        logger.info(
          `[processRefund] Refund ${refundId} already succeeded. Skipping.`
        );
        return;
      }

      if (refund.status !== 'SCHEDULED') {
        throw new Error(
          `Refund ${refundId} has invalid status ${refund.status}`
        );
      }

      // WHY: Enforce scheduled time. If BullMQ fires early, throw error to trigger retry delay.
      if (Date.now() < refund.scheduledFor.getTime()) {
        throw new Error(
          `Refund ${refundId} is not yet eligible for processing`
        );
      }

      // 2. Recheck DB State
      const order = await prisma.order.findUnique({
        where: { id: refund.orderId },
        include: {
          eventPurchase: {
            include: { event: true },
          },
          paymentTransaction: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${refund.orderId} not found`);
      }

      if (order.status !== 'PAID') {
        throw new Error(`Order ${refund.orderId} is not PAID`);
      }

      const paymentTx = order.paymentTransaction;
      if (!paymentTx) {
        throw new Error(
          `PaymentTransaction for order ${refund.orderId} missing`
        );
      }

      if (paymentTx.status !== 'PAID') {
        throw new Error(
          `PaymentTransaction for order ${refund.orderId} is not PAID`
        );
      }

      if (!paymentTx.stripePaymentIntentId) {
        throw new Error(`PaymentTransaction missing stripePaymentIntentId`);
      }

      // Verify Event is still CANCELED
      if (!order.eventPurchase) {
        throw new Error(`Order ${order.id} is missing eventPurchase`);
      }

      if (order.eventPurchase.event.eventStatus !== 'CANCELED') {
        throw new Error(`Event for order ${order.id} is not CANCELED`);
      }

      // 3. Prepare Stripe call
      // WHY: Safe decimal-to-cents conversion without floating-point arithmetic.
      const amountInCents = refund.amount.mul(100).toNumber();

      // 4. Stripe Refund execution
      const stripeRefund = await stripe.refunds.create(
        {
          payment_intent: paymentTx.stripePaymentIntentId,
          amount: amountInCents,
        },
        {
          // WHY: Reusing persisted key ensures we never double refund.
          idempotencyKey: refund.idempotencyKey,
        }
      );

      // 5. Finalize Record
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          stripeRefundId: stripeRefund.id,
          status: 'SUCCEEDED',
          completedAt: new Date(),
        },
      });

      logger.info(
        `[processRefund] Successfully executed refund ${refundId} for order ${order.id}`
      );
    } catch (error) {
      logger.error(
        `[processRefund] Failed to process refund ${refundId}`,
        error
      );

      // WHY: We DO NOT immediately set status = FAILED.
      // Unknown Stripe outcomes must remain retryable via BullMQ.
      // Setting FAILED here could prematurely terminate a refund that successfully reached Stripe but had a network timeout returning to us.

      throw error;
    }
  },
};

export default handler;
