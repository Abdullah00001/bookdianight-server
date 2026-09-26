import { z } from 'zod';

export const createReviewSchema = z.object({
  clubId: z.string().uuid('Invalid clubId format'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  review: z.string().max(1000, 'Review cannot exceed 1000 characters').optional(),
});

export type TCreateReviewPayload = z.infer<typeof createReviewSchema>;
