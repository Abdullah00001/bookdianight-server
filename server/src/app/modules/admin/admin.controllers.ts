import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { COOKIE_NAMES, adminAccessTokenExpiresIn, refreshTokenExpiresInWithRememberMe } from '@/const';
import { cookieOption } from '@/app/utils/cookie.utils';
import {
  loginAdminService,
  checkAdminService,
  refreshAdminService,
  logoutAdminService,
} from '@/app/modules/admin/admin.services';
import { TAdminLoginPayload } from '@/app/modules/admin/admin.schema';
import { User } from '@prisma/client';

/**
 * Controller for admin login.
 * Calls service to validate and generate tokens. Sets secure cookies.
 * 
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const loginAdminController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const payload = req.body as TAdminLoginPayload;
    
    // User is injected by findUserByEmail middleware if we use it, 
    // but the requirement specified validateReqBody -> loginAdminController -> service.
    // So we need to ensure the user is passed or fetched. 
    // Wait, the plan says validateReqBody -> loginAdminController, which means the service must fetch it? 
    // Let's use the existing findUserByEmail middleware from auth module if possible, 
    // or just fetch it in the controller/service.
    // Actually, I'll pass the `user` from `req.user` since we will chain `findUserByEmail` in routes.
    const user = req.user as User;

    const { accessToken, refreshToken, csrfToken, user: adminData } = await loginAdminService({
      user,
      payload,
    });

    res.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      cookieOption(adminAccessTokenExpiresIn)
    );

    res.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      cookieOption(refreshTokenExpiresInWithRememberMe)
    );

    res.cookie(
      COOKIE_NAMES.ADMIN_CSRF_TOKEN,
      csrfToken,
      {
        ...cookieOption(refreshTokenExpiresInWithRememberMe),
        httpOnly: false, // Required for Double Submit CSRF
      }
    );

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: adminData,
      traceId,
    });
  }
);

/**
 * Controller for checking admin auth status.
 * Relies completely on trusted context from middlewares.
 * 
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const checkAdminController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;

    const { user: adminData } = await checkAdminService({ user });

    res.status(200).json({
      success: true,
      message: 'Admin authenticated successfully',
      data: adminData,
      traceId,
    });
  }
);

/**
 * Controller for refreshing admin tokens.
 * Calls service to atomically rotate tokens and sets new cookies.
 * 
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const refreshAdminController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const oldRefreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    const { accessToken, refreshToken, csrfToken } = await refreshAdminService({
      user,
      refreshToken: oldRefreshToken,
    });

    res.cookie(
      COOKIE_NAMES.ACCESS_TOKEN,
      accessToken,
      cookieOption(adminAccessTokenExpiresIn)
    );

    res.cookie(
      COOKIE_NAMES.REFRESH_TOKEN,
      refreshToken,
      cookieOption(refreshTokenExpiresInWithRememberMe)
    );

    res.cookie(
      COOKIE_NAMES.ADMIN_CSRF_TOKEN,
      csrfToken,
      {
        ...cookieOption(refreshTokenExpiresInWithRememberMe),
        httpOnly: false,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Admin tokens refreshed successfully',
      traceId,
    });
  }
);

/**
 * Controller for admin logout.
 * Clears cookies and calls service to invalidate tokens in Redis.
 * 
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<void>}
 */
export const logoutAdminController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    await logoutAdminService({
      user,
      accessToken,
      refreshToken,
    });

    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, cookieOption(adminAccessTokenExpiresIn));
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, cookieOption(refreshTokenExpiresInWithRememberMe));
    res.clearCookie(COOKIE_NAMES.ADMIN_CSRF_TOKEN, {
      ...cookieOption(refreshTokenExpiresInWithRememberMe),
      httpOnly: false,
    });

    res.status(200).json({
      success: true,
      message: 'Admin logged out successfully',
      traceId,
    });
  }
);
