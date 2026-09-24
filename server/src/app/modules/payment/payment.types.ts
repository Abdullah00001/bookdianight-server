import { Order, PaymentTransaction } from '@prisma/client';

export interface IPaymentOrderContext {
  order: Order;
  userId: string;
  idempotencyKey: string;
}

export interface IPaymentIntentResult {
  transaction: PaymentTransaction;
  clientSecret: string | null;
  replayed: boolean;
}
