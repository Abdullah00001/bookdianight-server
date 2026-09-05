import {
  TCheckAccessTokenPayload,
  TSignupPayload,
  TVerifySignupUserPayload,
} from '@/app/modules/auth/auth.schema';
import { User } from '@prisma/client';

/**
 * Interface for signup service
 */
export interface ISignupService {
  payload: TSignupPayload;
}

/**
 * Interface for verify signup user service
 */
export interface IVerifySignupUserService {
  user: User;
  token: string;
  payload: TVerifySignupUserPayload;
}

/**
 * Interface for resend otp service
 */
export interface IResendOtpService {
  user: User;
}

import { JwtPayload } from 'jsonwebtoken';

export interface ICheckAccessTokenService {
  user: User;
  payload: TCheckAccessTokenPayload;
  jwtPayload: JwtPayload;
}
