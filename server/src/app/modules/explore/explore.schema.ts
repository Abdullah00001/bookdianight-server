import { z } from 'zod';

const booleanQuery = z.preprocess((val) => {
  if (val === 'true' || val === true) return true;
  if (val === 'false' || val === false) return false;
  return val;
}, z.boolean().optional());

export const exploreQuerySchema = z.object({
  type: z.enum(['CLUB', 'EVENT']).optional(),
  date: z.string().datetime().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  isPopular: booleanQuery,
  ratings: z.coerce.number().min(0).max(5).optional(),
  isVip: booleanQuery,
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['newest', 'oldest']).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'EVENT') {
    if (data.isPopular !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'isPopular is a Club-only filter and cannot be used with type=EVENT',
        path: ['isPopular']
      });
    }
    if (data.ratings !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ratings is a Club-only filter and cannot be used with type=EVENT',
        path: ['ratings']
      });
    }
    if (data.isVip !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'isVip is a Club-only filter and cannot be used with type=EVENT',
        path: ['isVip']
      });
    }
  }
});

export const exploreDetailQuerySchema = z.object({
  type: z.enum(['CLUB', 'EVENT'])
});

export type TExploreQuery = z.infer<typeof exploreQuerySchema>;
export type TExploreDetailQuery = z.infer<typeof exploreDetailQuerySchema>;

export const exploreIdParamsSchema = z.object({
  id: z.string().uuid()
});
