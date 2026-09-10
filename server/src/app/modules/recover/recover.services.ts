import { getRedisClient } from '@/app/configs/redis.configs';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { getEmailQueue } from '@/app/queues/email/email.queue';
import {
  extractToken,
  generateResetPasswordPageToken,
  verifyResetPasswordPageToken,
} from '@/app/utils/jwt.utils';
import { hashOtp } from '@/app/utils/otp.utils';
import {
  calculateMilliseconds,
  createRedisKey,
  generate,
} from '@/app/utils/system.utils';
import { otpExpireAt, QUEUE_JOBS, REDIS_PREFIXES } from '@/const';
import { User } from '@prisma/client';
import { Request } from 'express';
import { TResetRecoverUserOtpPayload } from '@/app/modules/recover/recover.schema';
import { hashPassword } from '@/app/utils/password.utils';
import { JwtPayload } from 'jsonwebtoken';
import prisma from '@/app/configs/db.configs';

/**
 * This service is used to find the user for the password reset.
 * @param req Request
 * @returns Promise<{ isAdmin: boolean; token: string }>  
 */
export const findRecoverUserService = async ({
  req,
}: {
  req: Request;
}): Promise<{ isAdmin: boolean; token: string }> => {
  try {
    const redisClient = getRedisClient();
    const emailQueue = getEmailQueue();
    const path = req.path;
    const isAdmin = path.includes('/admin/recover');
    const user = req.user as User;
    const traceId = getTraceId();
    const otp = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });
    const hashedOtp = hashOtp({ otp });
    const token = generateResetPasswordPageToken({
      sub: user.id,
      accountStatus: user.accountStatus,
      role: user.accountRole,
      isVerified: user.isVerified,
    });
    const emailData = {
      name: user.name,
      email: user.email,
      otp,
      otpExpireAt,
      traceId,
    };
    await Promise.all([
      redisClient.set(
        createRedisKey(REDIS_PREFIXES.otp, user.id),
        hashedOtp,
        'EX',
        calculateMilliseconds(otpExpireAt, 'minutes')
      ),
      emailQueue.add(QUEUE_JOBS.RECOVER_USER_VERIFICATION_OTP, emailData),
    ]);
    return { isAdmin, token };
  } catch (error) {
    throw error;
  }
};

/**
 * This service is used to verify the OTP of the user.
 * @param user User
 * @returns Promise<void>
 */
export const verifyRecoverUserService = async ({
  user,
}: {
  user: User;
}): Promise<void> => {
  try {
    const redisClient = getRedisClient();
    await redisClient.del(createRedisKey(REDIS_PREFIXES.otp, user.id));
    return;
  } catch (error) {
    throw error;
  }
};

/**
 * This service is used to reset the password of the user.
 * @param req Request
 * @returns Promise<void>
 */
export const recoverUserPasswordResetService = async ({
  req,
}: {
  req: Request;
}): Promise<{ isAdmin: boolean }> => {
  try {
    const user = req.user as User;
    const token = extractToken(req) as string;
    const redisClient = getRedisClient();
    const emailQueue = getEmailQueue();
    const traceId = getTraceId();
    const { password } = req.body as TResetRecoverUserOtpPayload;
    const path = req.path;
    const isAdmin = path.includes('/admin/recover');
    const hashedPassword = await hashPassword(password);
    const decoded = verifyResetPasswordPageToken(token)?.data as JwtPayload;
    const expirationTime = decoded?.exp as number;
    const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
    const ttl = Math.floor(expirationTime - currentTime); // remaining time in seconds
    if (ttl > 0)
      await redisClient.set(
        createRedisKey(REDIS_PREFIXES.blacklist, token),
        token,
        'EX',
        ttl
      );
    await prisma.user.update({
      data: { password: hashedPassword },
      where: { id: user.id },
    });
    const emailData = { email: user.email, name: user.name, traceId };
    await emailQueue.add(
      QUEUE_JOBS.RECOVER_USER_PASSWORD_RESET_SUCCESSFUL,
      emailData
    );
    return { isAdmin };
  } catch (error) {
    throw error;
  }
};

/**
 * This service is used to resend OTP to user when user forget their password
 * @param req Request
 * @returns Promise<void>
 */
export const recoverUserVerificationOtpResendService = async ({
  req,
}: {
  req: Request;
}): Promise<void> => {
  try {
    const user = req.user as User;
    const traceId = getTraceId();
    const redisClient = getRedisClient();
    const emailQueue = getEmailQueue();
    const otp = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });
    const hashedOtp = hashOtp({ otp });
    const emailData = {
      name: user.name,
      email: user.email,
      otp,
      otpExpireAt,
      traceId,
    };
    await Promise.all([
      redisClient.del(createRedisKey(REDIS_PREFIXES.otp, user.id)),
      redisClient.set(
        createRedisKey(REDIS_PREFIXES.otp, user.id),
        hashedOtp,
        'EX',
        calculateMilliseconds(otpExpireAt, 'minutes')
      ),
      emailQueue.add(
        QUEUE_JOBS.RECOVER_USER_VERIFICATION_OTP_RESEND,
        emailData
      ),
    ]);
    return;
  } catch (error) {
    throw error;
  }
};
