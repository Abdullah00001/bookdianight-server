import { z } from 'zod';

export const connectCallbackQuerySchema = z
  .object({ token: z.string().uuid('Invalid Connect callback token') })
  .strict();

export type TConnectCallbackQuery = z.infer<typeof connectCallbackQuerySchema>;
