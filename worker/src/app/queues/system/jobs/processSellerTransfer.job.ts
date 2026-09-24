import { IJobHandler } from '@/app/@types/queue.types';
import { QUEUE_JOBS } from '@/const';
import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';
import { stripe } from '@/app/configs/stripe.configs';

const handler: IJobHandler = {
  name: QUEUE_JOBS.PROCESS_SELLER_TRANSFER,
  handler: async (data: any) => {
    const { orderId } = data;

    // 1. Initial Idempotency Check & Lock
    let transferRecord = await prisma.sellerTransfer.findUnique({
      where: { orderId },
    });

    // WHY: SUCCEEDED transfer is a no-op, preventing duplicate payouts safely.
    if (transferRecord && transferRecord.status === 'SUCCEEDED') {
      logger.info(
        `[processSellerTransfer] Transfer already succeeded for order ${orderId}`
      );
      return;
    }

    if (!transferRecord) {
      // WHY: SellerTransfer is persisted before Stripe execution.
      // This guarantees the idempotencyKey is recorded so retries reuse it.
      transferRecord = await prisma.sellerTransfer.create({
        data: {
          orderId,
          idempotencyKey: `transfer-${orderId}`,
          amount: 0, // temporary, will be updated immediately
          currency: 'EUR',
          status: 'PENDING',
        },
      });
    }

    try {
      // 2. Load CURRENT database state
      // WHY: Worker reloads current database state to ensure it doesn't operate on stale webhook data.
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          eventPurchase: {
            include: { event: true },
          },
          clubBooking: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.status !== 'PAID') {
        throw new Error(`Order ${orderId} is not PAID`);
      }

      // Update transfer record with correct amounts if it was just created
      if (Number(transferRecord.amount) !== Number(order.sellerEarnings)) {
        transferRecord = await prisma.sellerTransfer.update({
          where: { id: transferRecord.id },
          data: {
            amount: order.sellerEarnings,
            currency: order.currency,
            // Re-affirm PENDING status in case it previously FAILED and is now retrying
            status: 'PENDING',
          },
        });
      }

      // 3. Connect Account Readiness
      const connectAccount = await prisma.stripeConnectAccount.findUnique({
        where: { userId: order.sellerUserId },
      });

      if (!connectAccount || connectAccount.status !== 'ACTIVE') {
        throw new Error(
          `StripeConnectAccount for user ${order.sellerUserId} is not ACTIVE`
        );
      }

      // 4. Validate Event specific rules
      if (order.serviceType === 'EVENT') {
        if (!order.eventPurchase) {
          throw new Error(`Event purchase missing for order ${orderId}`);
        }

        // WHY: Canceled Events must not transfer. Reloaded state confirms current status.
        if (order.eventPurchase.event.eventStatus === 'CANCELED') {
          logger.info(
            `[processSellerTransfer] Event canceled. Skipping transfer for order ${orderId}`
          );
          await prisma.sellerTransfer.update({
            where: { id: transferRecord.id },
            data: { status: 'FAILED' },
          });
          return;
        }

        // WHY: Event transfer waits until transferEligibleAt. Rechecking ensures we don't transfer early.
        if (Date.now() < order.eventPurchase.transferEligibleAt.getTime()) {
          throw new Error(`Transfer for order ${orderId} is not yet eligible`);
        }
      } else if (order.serviceType === 'CLUB') {
        if (order.clubBooking?.status !== 'BOOKED') {
          throw new Error(`Club booking for order ${orderId} is not BOOKED`);
        }
      }

      // 5. Execute Stripe Transfer
      // WHY: sellerEarnings is the transfer amount since Platform has already collected the buyer payment.
      const amountInCents = Math.round(Number(transferRecord.amount) * 100);

      const transfer = await stripe.transfers.create(
        {
          amount: amountInCents,
          currency: transferRecord.currency,
          destination: connectAccount.stripeAccountId,
          transfer_group: order.id,
        },
        {
          // WHY: The same idempotency key must be reused after Stripe success/DB failure.
          // This makes retries perfectly safe and prevents duplicate payout.
          idempotencyKey: transferRecord.idempotencyKey,
        }
      );

      // 6. Finalize Record
      await prisma.sellerTransfer.update({
        where: { id: transferRecord.id },
        data: {
          stripeTransferId: transfer.id,
          status: 'SUCCEEDED',
          completedAt: new Date(),
        },
      });

      logger.info(
        `[processSellerTransfer] Successfully processed transfer for order ${orderId}`
      );
    } catch (error) {
      logger.error(
        `[processSellerTransfer] Failed to process transfer for order ${orderId}`,
        error
      );

      await prisma.sellerTransfer.update({
        where: { id: transferRecord.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  },
};

export default handler;
