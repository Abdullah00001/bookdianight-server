import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { getUserProfileService, updateUserProfileService, changePasswordService } from '@/app/modules/profile/profile.services';
import { User } from '@prisma/client';
import { TChangePasswordPayload } from '@/app/modules/profile/profile.schema';
import { comparePassword } from '@/app/utils/password.utils';
import { AuthErrorType } from '@/const';

/**
 * Handles fetching the current user's profile.
 * @param req Request
 * @param res Response
 */
export const getUserProfileController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    
    const profileData = await getUserProfileService({ userId: user.id });
    
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profileData,
      traceId
    });
    return;
  }
);

/**
 * Handles updating the current user's profile.
 * @param req Request
 * @param res Response
 */
export const updateUserProfileController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    
    const updatedData = await updateUserProfileService({ userId: user.id, payload: req.body });
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedData,
      traceId
    });
    return;
  }
);

/**
 * Handles changing the current user's password.
 * @param req Request
 * @param res Response
 */
export const changePasswordController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const payload = req.body as TChangePasswordPayload;
    
    const isMatched = await comparePassword(payload.currentPassword, user.password as string);
    if (!isMatched) {
      res.status(401).json({
        success: false,
        errorType: AuthErrorType.INVALID_CREDENTIALS,
        message: 'Incorrect current password',
        traceId,
      });
      return;
    }

    await changePasswordService({ userId: user.id, payload });
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      traceId
    });
    return;
  }
);
