import prisma from '@/app/configs/db.configs';
import {
  IGetUserProfileService,
  IUpdateUserProfileService,
  IChangePasswordService,
} from '@/app/modules/profile/profile.types';

/**
 * Service for fetching user profile.
 * Retrieves the user's core data and nested profile fields.
 * Returns the sanitized user record.
 * @returns Promise<Record<string, unknown>>
 */
export const getUserProfileService = async ({
  userId,
}: IGetUserProfileService): Promise<Record<string, unknown>> => {
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
 * Service for updating user profile.
 * Modifies the user's core fields and nested profile fields atomically via a transaction.
 * Returns the updated sanitized user record.
 * @returns Promise<Record<string, unknown>>
 */
export const updateUserProfileService = async ({
  userId,
  payload,
}: IUpdateUserProfileService): Promise<Record<string, unknown>> => {
  try {
    const { name, phoneNumber, ...profileData } = payload;

    // Convert dateOfBirth string to Date object if provided
    const parsedProfileData = {
      ...profileData,
      ...(profileData.dateOfBirth ? { dateOfBirth: new Date(profileData.dateOfBirth) } : {}),
    };

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
      if (Object.keys(parsedProfileData).length > 0) {
        await tx.profile.update({
          where: { userId },
          data: parsedProfileData,
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

/**
 * Service for changing user password.
 * Hashes the new password and updates the user record.
 * @returns Promise<void>
 */
export const changePasswordService = async ({
  userId,
  payload,
}: IChangePasswordService): Promise<void> => {
  try {
    const { newPassword } = payload;
    const { hashPassword } = await import('@/app/utils/password.utils');
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  } catch (error) {
    throw error;
  }
};
