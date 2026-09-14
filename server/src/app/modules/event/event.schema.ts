import { z } from 'zod';

// Assuming EventStatus is imported or mapped, but we just use string enum in validation
export const eventStatusEnum = z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELED']);

export const createEventSchema = z.object({
  eventName: z.string().min(1),
  eventDescription: z.string().nullable().optional(),
  thumbnail: z.string().url(),
  images: z.array(z.string().url()),
  eventStatus: eventStatusEnum.default('UPCOMING'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  dressCode: z.string(),
  eventPrice: z.number().nonnegative(),
  currency: z.string().min(1),
});

export const updateEventSchema = z.object({
  eventName: z.string().min(1).optional(),
  eventDescription: z.string().nullable().optional(),
  thumbnail: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  eventStatus: eventStatusEnum.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  dressCode: z.string().optional(),
  eventPrice: z.number().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  isActive: z.boolean().optional(), // Maps to deactivatedAt in the service
});

export type TCreateEventPayload = z.infer<typeof createEventSchema>;
export type TUpdateEventPayload = z.infer<typeof updateEventSchema>;

export const eventIdParamsSchema = z.object({
  id: z.string().uuid()
});
