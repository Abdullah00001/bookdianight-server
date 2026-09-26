import { z } from 'zod';

export const retrieveLoggedInUserBookingsQuerySchema = z.object({
  tab: z.enum(['UPCOMING', 'COMPLETED', 'CANCELED']).optional().default('UPCOMING'),
  page: z.preprocess((val) => Number(val) || 1, z.number().min(1).default(1)),
  limit: z.preprocess((val) => Number(val) || 10, z.number().min(1).default(10)),
});

export type TRetrieveLoggedInUserBookingsQuery = z.infer<typeof retrieveLoggedInUserBookingsQuerySchema>;

export const retrieveLoggedInUserSingleBookingsQuerySchema = z.object({
  type: z.enum(['CLUB', 'EVENT']),
});

export type TRetrieveLoggedInUserSingleBookingsQuery = z.infer<typeof retrieveLoggedInUserSingleBookingsQuerySchema>;

export const retrieveLoggedInUserSingleBookingsParamsSchema = z.object({
  id: z.string().uuid('Invalid booking id'),
});
