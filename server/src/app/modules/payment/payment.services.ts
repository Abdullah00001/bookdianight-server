import { Prisma } from '@prisma/client';
import { stripe } from '@/app/configs/stripe.configs';
import prisma from '@/app/configs/db.configs';
import { IPaymentOrderContext, IPaymentIntentResult } from '@/app/modules/payment/payment.types';

/**
 * Initializes or retrieves the Stripe PaymentIntent for a given Order.
 * 
 * WHY Order is the authoritative amount source: Flutter cannot be trusted with amount/currency calculations.
 * The server snapshots the buyerTotal during Purchase, which is the only valid source of truth.
 * 
 * WHY exactly one PaymentIntent per Order: Strict lifecycle invariant mapping 1 Order -> 1 PaymentTransaction. 
 * Re-initializations must safely reuse the existing Intent.
 * 
 * WHY Stripe idempotency key: Ensures network retries to Stripe do not create duplicate Intents independently.
 * 
 * WHY PaymentIntent creation does not mark the Order as paid: Payment finalization is asynchronous.
 * Only the future Stripe webhook can authoritatively finalize the success state.
 */
export const createPaymentIntentService = async (
  context: IPaymentOrderContext
): Promise<IPaymentIntentResult> => {
  const { order, idempotencyKey } = context;

  try {
    // Check if initialization already occurred
    let transaction = await prisma.paymentTransaction.findUnique({
      where: { orderId: order.id },
    });

    if (transaction && transaction.stripePaymentIntentId) {
      // Replay: retrieve existing PaymentIntent from Stripe to get the clientSecret
      const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
      
      return {
        transaction,
        clientSecret: paymentIntent.client_secret,
        replayed: true,
      };
    }

    // Amount is in cents for EUR
    const amountInCents = Math.round(Number(order.buyerTotal) * 100);

    // WHY: Use order-based Stripe idempotency key so we never create a second Intent for the same Order
    const stripeIdempotencyKey = `pi_init_${order.id}`;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: 'eur',
        metadata: {
          orderId: order.id,
          buyerUserId: order.buyerUserId,
          serviceType: order.serviceType,
        },
      },
      { idempotencyKey: stripeIdempotencyKey }
    );

    // WHY: We persist the transaction to track the PENDING state and link the Stripe intent to the Order.
    transaction = await prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        idempotencyKey,
        amount: order.buyerTotal,
        currency: 'eur',
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    return {
      transaction,
      clientSecret: paymentIntent.client_secret,
      replayed: false,
    };
  } catch (error) {
    // If a unique constraint fails, it means concurrent creation happened.
    // Fetch and return the newly created transaction if it exists.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const transaction = await prisma.paymentTransaction.findUnique({
        where: { orderId: order.id },
      });
      if (transaction && transaction.stripePaymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.retrieve(transaction.stripePaymentIntentId);
        return {
          transaction,
          clientSecret: paymentIntent.client_secret,
          replayed: true,
        };
      }
    }
    // Unexpected Prisma/Stripe/network errors propagate unchanged to globalErrorMiddleware
    throw error;
  }
};
