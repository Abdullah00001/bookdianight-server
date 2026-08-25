import { getRedisClient } from '@/app/configs/redis.configs';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { TSignupPayload } from '@/app/modules/auth/auth.schema';
import { hashOtp } from '@/app/utils/otp.utils';
import { hashPassword } from '@/app/utils/password.utils';
import { generate } from '@/app/utils/system.utils';

export const signupService = async ({
  payload,
}: {
  payload: TSignupPayload;
}): Promise<void> => {
  const redisClient = getRedisClient();
  const traceId = getTraceId();
  try {
    const hashPass = await hashPassword(payload.password);
    const otp = generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      specialChars: false,
      upperCaseAlphabets: false,
    });
    const hashedOtp = hashOtp({ otp });
    return;
  } catch (error) {
    throw error;
  }
};
