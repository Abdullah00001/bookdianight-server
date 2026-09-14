import { z } from 'zod';



export const createWishlistSchema = z.object({
  type: z.enum(['CLUB', 'EVENT']),
  targetId: z.string().uuid()
});

export type TCreateWishlistPayload = z.infer<typeof createWishlistSchema>;

export const getWishlistQuerySchema = z.object({
  type: z.enum(['CLUB', 'EVENT']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type TGetWishlistQuery = z.infer<typeof getWishlistQuerySchema>;

export const removeWishlistParamsSchema = z.object({
  type: z.enum(['CLUB', 'EVENT']),
  targetId: z.string().uuid()
});
