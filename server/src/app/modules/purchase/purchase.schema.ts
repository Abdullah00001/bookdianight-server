import { z } from 'zod';

const fixedCstDateTime = z
  .string()
  .datetime({ offset: true })
  .regex(/-06:00$/, 'Date/time must use the fixed CST offset -06:00');
export const clubAvailabilityQuerySchema = z
  .object({
    clubId: z.uuid(),
    startAt: fixedCstDateTime,
    endAt: fixedCstDateTime,
    guestCount: z.coerce.number().int().positive(),
  })
  .strict()
  .refine(
    (data) => new Date(data.startAt).getTime() < new Date(data.endAt).getTime(),
    {
      message: 'endAt must be strictly after startAt',
      path: ['endAt'],
    }
  );
export const createClubPurchaseSchema = z
  .object({
    clubPackageId: z.uuid(),
    startAt: fixedCstDateTime,
    endAt: fixedCstDateTime,
    guestCount: z.coerce.number().int().positive(),
  })
  .strict()
  .refine(
    (data) => new Date(data.startAt).getTime() < new Date(data.endAt).getTime(),
    {
      message: 'endAt must be strictly after startAt',
      path: ['endAt'],
    }
  );
export const friendSchema = z
  .object({
    name: z.string().trim().min(1),
    phoneNumber: z.string().trim().min(1),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    age: z.number().int().positive(),
    image: z.url().optional(),
  })
  .strict();
export const createEventPurchaseSchema = z
  .object({
    eventId: z.uuid(),
    friends: z.array(friendSchema).max(4).default([]),
  })
  .strict();
export type TClubAvailabilityQuery = z.infer<
  typeof clubAvailabilityQuerySchema
>;
export type TCreateClubPurchasePayload = z.infer<
  typeof createClubPurchaseSchema
>;
export type TCreateEventPurchasePayload = z.infer<
  typeof createEventPurchaseSchema
>;
