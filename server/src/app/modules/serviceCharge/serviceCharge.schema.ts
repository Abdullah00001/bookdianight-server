import { z } from 'zod';

export const updateServiceChargeSchema = z
  .object({
    amount: z
      .number()
      .finite('Service Charge amount must be a finite number')
      .positive('Service Charge amount must be greater than 0.00')
      .max(99999999.99, 'Service Charge amount must not exceed 99999999.99')
      .refine(
        (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
        'Service Charge amount must have at most 2 decimal places'
      ),
  })
  .strict();

export type TUpdateServiceChargePayload = z.infer<
  typeof updateServiceChargeSchema
>;
