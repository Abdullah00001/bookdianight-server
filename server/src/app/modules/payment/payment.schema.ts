import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  orderId: z.string({
    message: 'Order ID is required',
  }).uuid('Invalid Order ID'),
});
