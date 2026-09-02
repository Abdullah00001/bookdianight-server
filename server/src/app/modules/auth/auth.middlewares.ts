import { NextFunction, Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler, createRedisKey } from '@/app/utils/system.utils';
import { TSignupPayload } from '@/app/modules/auth/auth.schema';
import prisma from '@/app/configs/db.configs';
import { extractToken, verifyOtpPageToken } from '@/app/utils/jwt.utils';
import { getRedisClient } from '@/app/configs/redis.configs';
import { AuthErrorType, REDIS_PREFIXES } from '@/const';
import { JwtPayload } from 'jsonwebtoken';
import { compareOtp } from '@/app/utils/otp.utils';
import { User } from '@prisma/client';

/**
 * This middleware is used to check if the user already exists with the email user trying to signup.
 * If the user exists, it will return a 409 response.
 * If the user does not exist, it will call return next() for further process.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const checkSignupUserExists = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = getTraceId();
    const { email } = req.body as TSignupPayload;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exist',
        traceId,
      });
    }
    return next();
  }
);

/**
 * This middleware is used to check if the OTP page token is valid and not expired.
 * If the token is invalid or expired, it will return a 401 response.
 * If the token is valid and not expired, it will call return next() for further process.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const checkOtpPageToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = getTraceId();
    const token = extractToken(req);
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication token not found',
        errorType: AuthErrorType.TOKEN_INVALID,
        traceId,
      });
      return;
    }
    const redisClient = getRedisClient();
    const isBlackListed = await redisClient.get(`blacklist:jwt:${token}`);
    if (isBlackListed) {
      res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        errorType: AuthErrorType.TOKEN_BLACKLISTED,
        traceId,
      });
      return;
    }
    const decoded = verifyOtpPageToken(token);
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        errorType: AuthErrorType.TOKEN_INVALID,
        traceId,
      });
      return;
    }
    req.user = decoded as JwtPayload;
    return next();
  }
);

/**
 * This middleware is used to check if the OTP is valid and not expired.
 * If the OTP is invalid or expired, it will return a 401 response.
 * If the OTP is valid and not expired, it will call return next() for further process.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */

export const checkOtp = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const { otp } = req.body;
    // get the redis client
    const redisClient = getRedisClient();
    const hashedOtp = await redisClient.get(
      createRedisKey(REDIS_PREFIXES.otp, user.id)
    );
    if (!hashedOtp) {
      res.status(401).json({
        success: false,
        message: 'OTP has expired, please request a new one',
        errorType: AuthErrorType.OTP_EXPIRED,
        traceId,
      });
      return;
    }
    const isMatched = compareOtp({ hashedOtp, otp });
    if (!isMatched) {
      res.status(401).json({
        success: false,
        message: 'Invalid OTP, please check and try again',
        errorType: AuthErrorType.INVALID_OTP,
        traceId,
      });
      return;
    }
    next();
  }
);

/**
 * This middleware is used to check if the user exists.
 * If the user does not exist, it will return a 404 response.
 * If the user exists, it will call return next() for further process.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const checkUserExistence = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const isUserExist = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!isUserExist) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        errorType: AuthErrorType.USER_NOT_FOUND,
        traceId,
      });
      return;
    }
    req.user = isUserExist as User;
    next();
  }
);
