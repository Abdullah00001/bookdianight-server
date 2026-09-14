import { z } from 'zod';

export const clubOpeningHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isClosed: z.boolean(),
  openTime: z.string().datetime().nullable().optional(),
  closeTime: z.string().datetime().nullable().optional(),
  closesNextDay: z.boolean(),
});

export const clubPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  capacity: z.number().int().positive(),
  price: z.number().nonnegative(),
  currency: z.string().min(1),
  features: z.array(z.string()),
  sortOrder: z.number().int().default(0),
});

export const createClubSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  thumbnail: z.string().url(),
  images: z.array(z.string().url()),
  dressCode: z.string(),
  isRecurring: z.boolean(),
  isVip: z.boolean().default(false),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  openingHours: z.array(clubOpeningHourSchema).length(7).refine(
    (hours) => new Set(hours.map((h) => h.dayOfWeek)).size === 7,
    { message: 'openingHours must contain exactly one entry for each day of the week (0-6)' }
  ),
  packages: z.array(clubPackageSchema).refine(
    (pkgs) => {
      if (pkgs.length <= 1) return true;
      const firstCurrency = pkgs[0].currency;
      return pkgs.every((pkg) => pkg.currency === firstCurrency);
    },
    { message: 'All packages within a club must have the same currency' }
  ),
});

export const updateClubOpeningHourSchema = clubOpeningHourSchema.extend({
  id: z.string().uuid(),
});

export const updateClubPackageSchema = clubPackageSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

export const updateClubSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  thumbnail: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  dressCode: z.string().optional(),
  isRecurring: z.boolean().optional(),
  isVip: z.boolean().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  openingHours: z.array(updateClubOpeningHourSchema).length(7).refine(
    (hours) => new Set(hours.map((h) => h.dayOfWeek)).size === 7,
    { message: 'openingHours must contain exactly one entry for each day of the week (0-6)' }
  ).optional(),
  packages: z.array(updateClubPackageSchema).refine(
    (pkgs) => {
      if (pkgs.length <= 1) return true;
      const firstCurrency = pkgs[0].currency;
      return pkgs.every((pkg) => pkg.currency === firstCurrency);
    },
    { message: 'All packages within a club must have the same currency' }
  ).optional(),
});

export type TCreateClubPayload = z.infer<typeof createClubSchema>;
export type TUpdateClubPayload = z.infer<typeof updateClubSchema>;

export const clubIdParamsSchema = z.object({
  id: z.string().uuid()
});
export type TClubOpeningHourPayload = z.infer<typeof clubOpeningHourSchema>;
export type TClubPackagePayload = z.infer<typeof clubPackageSchema>;
export type TUpdateClubOpeningHourPayload = z.infer<typeof updateClubOpeningHourSchema>;
export type TUpdateClubPackagePayload = z.infer<typeof updateClubPackageSchema>;

const booleanQuery = z.preprocess((val) => {
  if (val === 'true' || val === true) return true;
  if (val === 'false' || val === false) return false;
  return val;
}, z.boolean().optional());

export const clubListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  isActive: booleanQuery,
});

export type TClubListQuery = z.infer<typeof clubListQuerySchema>;
