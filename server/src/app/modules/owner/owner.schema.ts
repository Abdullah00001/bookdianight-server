import { z } from 'zod';

export const ownerEarningsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const ownerPaymentsQuerySchema = z
  .object({
    type: z.enum(['CLUB', 'EVENT']).optional(),
    clubId: z.string().uuid().optional(),
    eventId: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .refine(
    (data) => {
      if (data.clubId && data.type !== 'CLUB') return false;
      if (data.eventId && data.type !== 'EVENT') return false;
      if (data.clubId && data.eventId) return false;
      return true;
    },
    {
      message: 'Invalid filter combination: clubId requires type=CLUB, eventId requires type=EVENT, and they cannot be combined',
      path: ['type'],
    }
  );