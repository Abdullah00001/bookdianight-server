import { z } from 'zod';

// Assuming EventStatus is imported or mapped, but we just use string enum in validation
export const eventStatusEnum = z.enum([
  'UPCOMING',
  'ONGOING',
  'COMPLETED',
  'CANCELED',
]);

export const createEventSchema = z
  .object({
    eventName: z.string().min(1),
    eventDescription: z.string().nullable().optional(),
    thumbnail: z.url(),
    images: z.array(z.url()),
    eventStatus: eventStatusEnum.default('UPCOMING'),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    location: z.string().min(1),
    startAt: z.date(),
    endAt: z.date(),
    dressCode: z.string(),
    eventPrice: z.number().nonnegative(),
    currency: z.string().min(1),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: 'endAt must be later than startAt',
    path: ['endAt'],
  });

export const updateEventSchema = z
  .object({
    eventName: z.string().min(1).optional(),
    eventDescription: z.string().nullable().optional(),
    thumbnail: z.url().optional(),
    images: z.array(z.url()).optional(),
    eventStatus: eventStatusEnum.optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    location: z.string().min(1).optional(),
    startAt: z.date().optional(),
    endAt: z.date().optional(),
    dressCode: z.string().optional(),
    eventPrice: z.number().nonnegative().optional(),
    currency: z.string().min(1).optional(),
    isActive: z.boolean().optional(), // Maps to deactivatedAt in the service
  })
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return new Date(data.endAt) > new Date(data.startAt);
      }
      return true; // If only one or none is provided, we can't definitively check here without DB state, so we let it pass.
    },
    {
      message: 'endAt must be later than startAt',
      path: ['endAt'],
    }
  );

export type TCreateEventPayload = z.infer<typeof createEventSchema>;
export type TUpdateEventPayload = z.infer<typeof updateEventSchema>;

export const eventIdParamsSchema = z.object({
  id: z.uuid(),
});

const booleanQuery = z.preprocess((val) => {
  if (val === 'true' || val === true) return true;
  if (val === 'false' || val === false) return false;
  return val;
}, z.boolean().optional());

export const eventListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  eventStatus: eventStatusEnum.optional(),
  isActive: booleanQuery,
});

export type TEventListQuery = z.infer<typeof eventListQuerySchema>;
