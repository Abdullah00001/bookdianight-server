import {
  TCheckAccessTokenPayload,
  TLoginPayload,
  TSignupPayload,
  TVerifySignupUserPayload,
  TLogoutPayload,
} from '@/app/modules/auth/auth.schema';
import { User, Device } from '@prisma/client';
import { ITokenPayload } from '@/app/@types/jwt.types';

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
  device: Device;
}

export interface ILoginService {
  user: User;
  payload: TLoginPayload;
}

export interface ILogoutService {
  user: User;
  payload: TLogoutPayload;
  jwtPayload: ITokenPayload;
  token: string;
  device: Device;
}
