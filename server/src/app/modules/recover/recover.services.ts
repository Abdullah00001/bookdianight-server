import { getRedisClient } from '@/app/configs/redis.configs';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { getEmailQueue } from '@/app/queues/email/email.queue';
import { generateResetPasswordPageToken } from '@/app/utils/jwt.utils';
import { hashOtp } from '@/app/utils/otp.utils';
import {
  calculateMilliseconds,
  createRedisKey,
  generate,
} from '@/app/utils/system.utils';
import { otpExpireAt, QUEUE_JOBS, REDIS_PREFIXES } from '@/const';
import { User } from '@prisma/client';
import { Request } from 'express';

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

export const verifyRecoverUserService = async (): Promise<void> => {
  try {
    console.log('verifyRecoverUserService called');
    return;
  } catch (error) {
    throw error;
  }
};

export const recoverUserPasswordResetService = async (): Promise<void> => {
  try {
    console.log('recoverUserPasswordResetService called');
    return;
  } catch (error) {
    throw error;
  }
};

export const recoverUserVerificationOtpResendService =
  async (): Promise<void> => {
    try {
      console.log('recoverUserVerificationOtpResendService called');
      return;
    } catch (error) {
      throw error;
    }
  };
