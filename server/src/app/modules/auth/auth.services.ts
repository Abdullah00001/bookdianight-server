import { TSignupPayload } from '@/app/modules/auth/auth.schema';

export const signupService = async ({
  payload,
}: {
  payload: TSignupPayload;
}): Promise<void> => {
  try {
    console.log('signupService called');
    return;
  } catch (error) {
    throw error;
  }
};
