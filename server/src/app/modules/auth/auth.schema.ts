import { z } from 'zod';

export const signupSchema = z.object({
  role: z.enum(['CLUB_OWNER', 'USER']),
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  phoneNumber: z.string().min(5, 'Phone number is required'),
  location: z.string().min(1, 'Location is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fcmToken: z.string().min(1, 'FCM Token is required'),
  lat: z.number(),
  lng: z.number(),
  platform: z.enum(['ANDROID', 'IOS']),
});

export type TSignupPayload = z.infer<typeof signupSchema>;
