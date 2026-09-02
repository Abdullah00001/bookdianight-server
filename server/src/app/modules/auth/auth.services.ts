import { getRedisClient } from '@/app/configs/redis.configs';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { TSignupPayload } from '@/app/modules/auth/auth.schema';
import { hashOtp } from '@/app/utils/otp.utils';
import { hashPassword } from '@/app/utils/password.utils';
import {
  calculateMilliseconds,
  createRedisKey,
  generate,
} from '@/app/utils/system.utils';
import { getEmailQueue } from '@/app/queues/email/email.queue';
import prisma from '@/app/configs/db.configs';
import { AuthProvider } from '@prisma/client';
import { generateAccessTokenForUser } from '@/app/utils/jwt.utils';
import {
  locationExpireAt,
  otpExpireAt,
  QUEUE_JOBS,
  REDIS_PREFIXES,
} from '@/const';

export const signupService = async ({
  payload,
}: {
  payload: TSignupPayload;
}): Promise<Record<string, unknown>> => {
  const redisClient = getRedisClient();
  const emailQueue = getEmailQueue();
  const traceId = getTraceId();
  try {
    const {
      email,
      fcmToken,
      lat,
      lng,
      location,
      name,
      password,
      phoneNumber,
      platform,
      role,
    } = payload;
    const hashPass = await hashPassword(password);
    const otp = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });
    const hashedOtp = hashOtp({ otp });
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashPass,
          phoneNumber,
          accountRole: role,
        },
      });
      await tx.profile.create({
        data: {
          location,
          userId: user.id,
        },
      });
      await tx.device.create({
        data: {
          authProvider: AuthProvider.MANUAL,
          platform,
          fcmToken,
          userId: user.id,
        },
      });
      return user;
    });
    const token = generateAccessTokenForUser({
      sub: newUser.id,
      rememberMe: true,
      accountStatus: newUser.accountStatus,
      role: newUser.accountRole,
      isVerified: newUser.isVerified,
    });
    const emailQueueData = {
      name: newUser.name,
      email: newUser.email,
      otp,
      otpExpireAt,
      traceId,
    };
    await Promise.all([
      redisClient.set(
        createRedisKey(REDIS_PREFIXES.otp, newUser.id),
        hashedOtp,
        'EX',
        calculateMilliseconds(otpExpireAt, 'minutes')
      ),
      redisClient.set(
        createRedisKey(REDIS_PREFIXES.location, newUser.id),
        JSON.stringify({ lat, lng }),
        'EX',
        calculateMilliseconds(locationExpireAt, 'days')
      ),
      redisClient.geoadd(
        createRedisKey(REDIS_PREFIXES.locations),
        lat,
        lng,
        newUser.id
      ),
      emailQueue.add(QUEUE_JOBS.SEND_SIGNUP_SUCCESS_EMAIL, emailQueueData),
    ]);
    return { token };
  } catch (error) {
    throw error;
  }
};
