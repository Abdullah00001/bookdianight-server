import { Router } from 'express';
import {
  signupController,
  verifySignupUserController,
  resendOtpController,
} from '@/app/modules/auth/auth.controllers';
import { validateReqBody } from '@/app/utils/system.utils';
import {
  signupSchema,
  verifySignupUserSchema,
} from '@/app/modules/auth/auth.schema';
import {
  checkOtp,
  checkOtpPageToken,
  checkSignupUserExists,
  checkUserExistence,
} from '@/app/modules/auth/auth.middlewares';

const router = Router();

router
  .route('/auth/signup')
  .post(validateReqBody(signupSchema), checkSignupUserExists, signupController);

router
  .route('/auth/verify')
  .post(
    checkOtpPageToken,
    checkUserExistence,
    validateReqBody(verifySignupUserSchema),
    checkOtp,
    verifySignupUserController
  );

router
  .route('/auth/resend')
  .post(checkOtpPageToken, checkUserExistence, resendOtpController);

export default router;
