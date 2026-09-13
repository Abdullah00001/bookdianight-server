import { z } from 'zod';

export const updateLegalContentSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

export type TUpdateLegalContentPayload = z.infer<typeof updateLegalContentSchema>;
