import prisma from '@/app/configs/db.configs';
import { getRedisClient } from '@/app/configs/redis.configs';
import { createRedisKey, expiresInTimeUnitToMs } from '@/app/utils/system.utils';
import {
  generateAccessTokenForAdmin,
  generateRefreshToken,
} from '@/app/utils/jwt.utils';
import { hashToken } from '@/app/utils/crypto.utils';
import { AuthErrorType, REDIS_PREFIXES, refreshTokenExpiresInWithRememberMe } from '@/const';
import {
  ILoginAdminService,
  ICheckAdminService,
  IRefreshAdminService,
  ILogoutAdminService,
  IGetAdminProfileService,
  IUpdateAdminProfileService,
} from '@/app/modules/admin/admin.types';
import crypto from 'crypto';
import { ITokenPayload } from '@/app/@types/jwt.types';

/**
 * Service for admin login.
 * Operates on a trusted context established by middleware.
 * Generates tokens and sets up the Redis session.
 * 
 * @param {ILoginAdminService} param0
 * @returns {Promise<Record<string, unknown>>}
 */
export const loginAdminService = async ({
  user,
}: ILoginAdminService): Promise<Record<string, unknown>> => {
  const redisClient = getRedisClient();
  try {
    const tokenPayload: ITokenPayload = {
      sub: user.id,
      role: user.accountRole,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      rememberMe: true, // Always issue a longer-lived refresh token for admin
    };

    const accessToken = generateAccessTokenForAdmin(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Hash the raw refresh token for Redis storage
    const hashedRefreshToken = hashToken(refreshToken);
    
    // Calculate TTL for Redis key based on refresh token expiration
    // Use Math.floor to ensure an integer of seconds for Redis EX
    const refreshTokenTTL = Math.floor(expiresInTimeUnitToMs(refreshTokenExpiresInWithRememberMe) / 1000);
    
    const sessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, hashedRefreshToken);
    await redisClient.set(sessionKey, '1', 'EX', refreshTokenTTL);

    const { password: _password, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: userWithoutPassword,
    };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for checking admin authentication status.
 * Relies on the trusted context provided by middleware.
 * 
 * @param {ICheckAdminService} param0
 * @returns {Promise<Record<string, unknown>>}
 */
export const checkAdminService = async ({
  user,
}: ICheckAdminService): Promise<Record<string, unknown>> => {
  try {
    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
    };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for refreshing admin tokens.
 * Atomically consumes the old refresh token in Redis to prevent reuse.
 * 
 * @param {IRefreshAdminService} param0
 * @returns {Promise<Record<string, unknown>>}
 */
export const refreshAdminService = async ({
  user,
  refreshToken,
}: IRefreshAdminService): Promise<Record<string, unknown>> => {
  const redisClient = getRedisClient();
  try {
    const hashedRefreshToken = hashToken(refreshToken);
    const sessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, hashedRefreshToken);

    // Atomic consumption of the refresh token session
    const deletedCount = await redisClient.del(sessionKey);
    
    if (deletedCount === 0) {
      throw {
        status: 401,
        message: 'Refresh token is invalid or already consumed',
        errorType: AuthErrorType.TOKEN_INVALID,
      };
    }

    const tokenPayload: ITokenPayload = {
      sub: user.id,
      role: user.accountRole,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      rememberMe: true,
    };

    const newAccessToken = generateAccessTokenForAdmin(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newCsrfToken = crypto.randomBytes(32).toString('hex');

    const newHashedRefreshToken = hashToken(newRefreshToken);
    const refreshTokenTTL = Math.floor(expiresInTimeUnitToMs(refreshTokenExpiresInWithRememberMe) / 1000);
    
    const newSessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, newHashedRefreshToken);
    await redisClient.set(newSessionKey, '1', 'EX', refreshTokenTTL);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      csrfToken: newCsrfToken,
    };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for admin logout.
 * Blacklists the current access token and removes the specific refresh session.
 * 
 * @param {ILogoutAdminService} param0
 * @returns {Promise<void>}
 */
export const logoutAdminService = async ({
  user,
  accessToken,
  refreshToken,
}: ILogoutAdminService): Promise<void> => {
  const redisClient = getRedisClient();
  try {
    if (refreshToken) {
      const hashedRefreshToken = hashToken(refreshToken);
      const sessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, hashedRefreshToken);
      await redisClient.del(sessionKey);
    }

    if (accessToken) {
      // 15 minutes TTL for access token blacklist
      const accessTokenTTL = 15 * 60;
      const blacklistKey = createRedisKey(REDIS_PREFIXES.blacklist, accessToken);
      await redisClient.set(blacklistKey, '1', 'EX', accessTokenTTL);
    }
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for fetching admin profile.
 * Retrieves the admin's core data and nested profile fields.
 * Returns the sanitized admin record.
 * @returns Promise<Record<string, unknown>>
 */
export const getAdminProfileService = async ({
  userId,
}: IGetAdminProfileService): Promise<Record<string, unknown>> => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });

    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Service for updating admin profile.
 * Modifies the admin's core fields and nested profile fields atomically via a transaction.
 * Returns the updated sanitized admin record.
 * @returns Promise<Record<string, unknown>>
 */
export const updateAdminProfileService = async ({
  userId,
  payload,
}: IUpdateAdminProfileService): Promise<Record<string, unknown>> => {
  try {
    const { name, phoneNumber, profileAvatar } = payload;

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update User if User fields are provided
      if (name !== undefined || phoneNumber !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(name !== undefined && { name }),
            ...(phoneNumber !== undefined && { phoneNumber }),
          },
        });
      }

      // 2. Update Profile if Profile fields are provided
      if (profileAvatar !== undefined) {
        await tx.profile.update({
          where: { userId },
          data: {
            profileAvatar,
          },
        });
      }

      // 3. Fetch and return the combined result
      return await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true },
      });
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return {
      user: userWithoutPassword,
    };
  } catch (error) {
    throw error;
  }
};
