import { getRedisClient } from '@/app/configs/redis.configs';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { hashOtp } from '@/app/utils/otp.utils';
import { hashPassword, comparePassword } from '@/app/utils/password.utils';
import {
  calculateMilliseconds,
  createRedisKey,
  generate,
} from '@/app/utils/system.utils';
import { getEmailQueue } from '@/app/queues/email/email.queue';
import prisma from '@/app/configs/db.configs';
import { AuthProvider } from '@prisma/client';
import {
  generateAccessTokenForUser,
  generateOtpPageToken,
  verifyOtpPageToken,
} from '@/app/utils/jwt.utils';
import {
  locationExpireAt,
  otpExpireAt,
  QUEUE_JOBS,
  REDIS_PREFIXES,
} from '@/const';
import {
  ICheckAccessTokenService,
  ILoginService,
  IResendOtpService,
  ISignupService,
  IVerifySignupUserService,
} from '@/app/modules/auth/auth.types';
import { JwtPayload } from 'jsonwebtoken';

/**
 * Service for user signup.
 * Creates a new user with the given payload.
 * Generates an OTP and stores it in Redis.
 * Adds a job to the email queue to send the OTP to the user.
 * @returns Promise<{ token: string; }>
 */
export const signupService = async ({
  payload,
}: ISignupService): Promise<Record<string, unknown>> => {
  const redisClient = getRedisClient();
  const emailQueue = getEmailQueue();
  const traceId = getTraceId();
  try {
    const { email, lat, lng, location, name, password, phoneNumber, role } =
      payload;
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
      return user;
    });
    const token = generateOtpPageToken({
      accountStatus: newUser.accountStatus,
      role: newUser.accountRole,
      isVerified: newUser.isVerified,
      sub: newUser.id,
      deviceId: 'pending',
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

/**
 * Service for verifying signup user.
 * Verifies the OTP and updates the user status.
 * Removes the OTP from Redis.
 * @returns Promise<void>
 */
export const verifySignupUserService = async ({
  token,
  user,
  payload,
}: IVerifySignupUserService): Promise<Record<string, unknown>> => {
  try {
    const redisClient = getRedisClient();
    const traceId = getTraceId();
    const emailQueue = getEmailQueue();
    const { deviceIdentifier, fcmToken, platform } = payload;
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });
    const device = await prisma.device.upsert({
      where: { deviceIdentifier },
      create: {
        deviceIdentifier,
        fcmToken: fcmToken || null,
        platform,
        authProvider: AuthProvider.MANUAL,
        userId: user.id,
        isActive: true,
      },
      update: {
        userId: user.id,
        fcmToken: fcmToken || null,
        platform,
        lastSeenAt: new Date(),
        isActive: true,
      },
    });
    const accessToken = generateAccessTokenForUser({
      accountStatus: updatedUser.accountStatus,
      role: updatedUser.accountRole,
      isVerified: updatedUser.isVerified,
      sub: updatedUser.id,
      deviceId: device.id,
      rememberMe: true,
    });
    const decoded = verifyOtpPageToken(token) as JwtPayload;
    const tokenExpirationTime = decoded.exp as number;
    const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
    const ttl = Math.floor(tokenExpirationTime - currentTime); // remaining time in seconds
    if (ttl > 0)
      await redisClient.set(
        createRedisKey(REDIS_PREFIXES.blacklist, token),
        token as string,
        'EX',
        ttl
      );
    const emailData = {
      name: updatedUser.name,
      email: updatedUser.email,
      traceId,
    };
    await Promise.all([
      redisClient.del(createRedisKey(REDIS_PREFIXES.otp, updatedUser.id)),
      emailQueue.add(QUEUE_JOBS.SIGNUP_USER_VERIFICATION_SUCCESSFUL, emailData),
    ]);

    return { token: accessToken };
  } catch (error) {
    throw error;
  }
};

/**
 * Service for resending OTP.
 * Generates a new OTP and stores it in Redis.
 * Adds a job to the email queue to send the OTP to the user.
 * @returns Promise<void>
 */
export const resendOtpService = async ({
  user,
}: IResendOtpService): Promise<void> => {
  try {
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
      emailQueue.add(QUEUE_JOBS.RESEND_VERIFICATION_OTP, emailData),
    ]);
    return;
  } catch (error) {
    throw error;
  }
};

export const checkUserAccessTokenService = async ({
  payload,
  jwtPayload,
}: ICheckAccessTokenService): Promise<void> => {
  try {
    const { deviceIdentifier, fcmToken } = payload;
    const { sub, deviceId } = jwtPayload;

    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error('Device not found or invalid device context');
    }

    if (device.userId !== sub || device.deviceIdentifier !== deviceIdentifier) {
      throw new Error('Invalid device context');
    }

    // Throttle lastSeenAt updates to at most once per hour to minimize DB writes
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const shouldUpdateLastSeenAt = device.lastSeenAt < oneHourAgo;

    if (shouldUpdateLastSeenAt || (fcmToken && device.fcmToken !== fcmToken)) {
      await prisma.device.update({
        where: { id: device.id },
        data: {
          lastSeenAt: shouldUpdateLastSeenAt ? new Date() : undefined,
          fcmToken: fcmToken ? fcmToken : undefined,
        },
      });
    }

    return;
  } catch (error) {
    throw error;
  }
};
/**
 * Service for user login.
 * Validates credentials, checks account status, manages Device creation/updates/reassignment,
 * and returns the appropriate JWT (access token or OTP token).
 * @returns Promise<{ token: string; }>
 */
export const loginService = async ({
  payload,
}: ILoginService): Promise<Record<string, unknown>> => {
  try {
    const {
      email,
      password,
      deviceIdentifier,
      platform,
      fcmToken,
      rememberMe,
    } = payload;

    // 1. Find User by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 3. Verify account status
    if (user.accountStatus === 'BLOCKED' || user.accountStatus === 'INACTIVE') {
      throw new Error('Account is blocked or inactive');
    }

    // 4. Handle Unverified Users
    if (!user.isVerified) {
      // Reuse existing OTP mechanism if not verified
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

      const token = generateOtpPageToken({
        accountStatus: user.accountStatus,
        role: user.accountRole,
        isVerified: user.isVerified,
        sub: user.id,
        deviceId: 'pending',
      });

      const emailQueueData = {
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
        emailQueue.add(QUEUE_JOBS.RESEND_VERIFICATION_OTP, emailQueueData),
      ]);

      return { token };
    }

    // 5 & 6. Resolve and manage Device
    // We upsert: if it doesn't exist, create it (CASE A).
    // If it exists (CASE B or CASE C), update it and reassign userId.
    const device = await prisma.device.upsert({
      where: { deviceIdentifier },
      create: {
        deviceIdentifier,
        fcmToken: fcmToken || null,
        platform,
        authProvider: AuthProvider.MANUAL,
        userId: user.id,
        isActive: true,
      },
      update: {
        userId: user.id, // Handles CASE C (reassignment) silently, and is a no-op for CASE B
        platform,
        lastSeenAt: new Date(),
        isActive: true,
        ...(fcmToken ? { fcmToken } : {}), // Update fcmToken only if provided
      },
    });

    // 7. Generate access JWT with Device.id
    const accessToken = generateAccessTokenForUser({
      accountStatus: user.accountStatus,
      role: user.accountRole,
      isVerified: user.isVerified,
      sub: user.id,
      deviceId: device.id,
      rememberMe: rememberMe ?? false,
    });

    return { token: accessToken };
  } catch (error) {
    throw error;
  }
};
