import { IJobHandler } from '@/app/@types/queue.types';
import { QUEUE_JOBS } from '@/const';
import prisma from '@/app/configs/db.configs';
import logger from '@/app/configs/logger.configs';
import { stripe } from '@/app/configs/stripe.configs';
import { IProcessSellerTransfer } from '@/app/queues/system/system.types';

const handler: IJobHandler<IProcessSellerTransfer> = {
  name: QUEUE_JOBS.PROCESS_SELLER_TRANSFER,
  handler: async (data) => {
    const { orderId } = data;
    let transferRecord: Awaited<
      ReturnType<typeof prisma.sellerTransfer.findUnique>
    > = null;

    try {
      // 1. Load CURRENT database state
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

      transferRecord = await prisma.sellerTransfer.findUnique({
        where: { orderId },
      });

      // WHY: SUCCEEDED transfer is a no-op, preventing duplicate payouts safely.
      if (transferRecord?.status === 'SUCCEEDED') {
        logger.info(
          `[processSellerTransfer] Transfer already succeeded for order ${orderId}`
        );
        return;
      }

      if (!transferRecord) {
        // Financial transfer values are immutable. Create the durable retry
        // record from the Order snapshot rather than creating placeholders that
        // would require a prohibited update before the Stripe call.
        transferRecord = await prisma.sellerTransfer.create({
          data: {
            orderId,
            idempotencyKey: `transfer-${orderId}`,
            amount: order.sellerEarnings,
            currency: order.currency,
            status: 'PENDING',
          },
        });
      } else if (
        !transferRecord.amount.equals(order.sellerEarnings) ||
        transferRecord.currency !== order.currency
      ) {
        // Existing mismatches are historical-data integrity failures. They must
        // be repaired explicitly, never by mutating immutable transfer values.
        throw new Error(
          `SellerTransfer snapshot mismatch for order ${orderId}`
        );
      }

      // 2. Connect Account Readiness
      const connectAccount = await prisma.stripeConnectAccount.findUnique({
        where: { userId: order.sellerUserId },
      });

      if (!connectAccount || connectAccount.status !== 'ACTIVE') {
        throw new Error(
          `StripeConnectAccount for user ${order.sellerUserId} is not ACTIVE`
        );
      }

      // 3. Validate Event specific rules
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

      // 4. Execute Stripe Transfer
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

      // 5. Finalize Record
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

      if (transferRecord) {
        await prisma.sellerTransfer.update({
          where: { id: transferRecord.id },
          data: { status: 'FAILED' },
        });
      }

      throw error;
    }
  },
};

export default handler;
