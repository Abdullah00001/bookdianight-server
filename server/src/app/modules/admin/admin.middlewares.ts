import { NextFunction, Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler, createRedisKey } from '@/app/utils/system.utils';
import prisma from '@/app/configs/db.configs';
import { verifyAccessToken, verifyRefreshToken } from '@/app/utils/jwt.utils';
import { getRedisClient } from '@/app/configs/redis.configs';
import { AuthErrorType, COOKIE_NAMES, REDIS_PREFIXES } from '@/const';
import { User, AccountRole } from '@prisma/client';
import { ITokenPayload } from '@/app/@types/jwt.types';

/**
 * Validates the Double Submit Cookie CSRF token.
 * Extracts from the cookie and compares it to the X-CSRF-Token header.
 * Rejects if missing or mismatched.
 * 
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export const checkCsrfTokenMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const csrfCookie = req.cookies[COOKIE_NAMES.ADMIN_CSRF_TOKEN];
    const csrfHeader = req.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token',
        errorType: AuthErrorType.ACCESS_DENIED,
        traceId,
      });
      return;
    }

    next();
  }
);

/**
 * Validates the admin access token from the cookie.
 * Verifies JWT signature, expiration, and checks the Redis blacklist.
 * 
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export const checkAdminAccessTokenMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token not found in cookies',
        errorType: AuthErrorType.TOKEN_INVALID,
        traceId,
      });
      return;
    }

    const redisClient = getRedisClient();
    const isBlackListed = await redisClient.get(
      createRedisKey(REDIS_PREFIXES.blacklist, token)
    );

    if (isBlackListed) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        errorType: AuthErrorType.TOKEN_BLACKLISTED,
        traceId,
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    if (decoded.error) {
      res.status(401).json({
        success: false,
        message: decoded.error === AuthErrorType.TOKEN_EXPIRED ? 'Token has been expired' : 'Token is invalid',
        errorType: decoded.error,
        traceId,
      });
      return;
    }

    req.jwtPayload = decoded.data as ITokenPayload;
    next();
  }
);

/**
 * Validates the admin refresh token from the cookie.
 * Verifies JWT signature and expiration.
 * 
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export const checkAdminRefreshTokenMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const token = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Refresh token not found in cookies',
        errorType: AuthErrorType.TOKEN_INVALID,
        traceId,
      });
      return;
    }

    const decoded = verifyRefreshToken(token);
    if (decoded.error) {
      res.status(401).json({
        success: false,
        message: decoded.error === AuthErrorType.TOKEN_EXPIRED ? 'Refresh token has been expired' : 'Refresh token is invalid',
        errorType: decoded.error,
        traceId,
      });
      return;
    }

    req.jwtPayload = decoded.data as ITokenPayload;
    next();
  }
);

/**
 * Validates that the admin user exists, has the correct role, and is active.
 * Uses the trusted context from checkAdminAccessTokenMiddleware.
 * 
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export const checkAdminExistenceMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const jwtPayload = req.jwtPayload as ITokenPayload;
    const userId = jwtPayload.sub;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Admin user not found',
        errorType: AuthErrorType.USER_NOT_FOUND,
        traceId,
      });
      return;
    }

    if (user.accountRole !== AccountRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Requires admin privileges',
        errorType: AuthErrorType.ACCESS_DENIED,
        traceId,
      });
      return;
    }

    if (user.accountStatus === 'BLOCKED') {
      res.status(401).json({
        success: false,
        errorType: AuthErrorType.USER_BLOCKED,
        message: 'Your admin account has been blocked',
        traceId,
      });
      return;
    }

    if (user.accountStatus === 'INACTIVE') {
      res.status(401).json({
        success: false,
        errorType: AuthErrorType.ACCOUNT_INACTIVE,
        message: 'Your admin account has been deactivated',
        traceId,
      });
      return;
    }

    req.user = user;
    next();
  }
);

/**
 * Validates that the pre-authenticated user (e.g. from findUserByEmail) has the ADMIN role.
 * 
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>}
 */
export const checkAdminRoleMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;

    if (user.accountRole !== AccountRole.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Access denied: Requires admin privileges',
        errorType: AuthErrorType.ACCESS_DENIED,
        traceId,
      });
      return;
    }

    next();
  }
);

