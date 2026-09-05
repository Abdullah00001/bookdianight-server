import { Router } from 'express';
import {
  signupController,
  verifySignupUserController,
  resendOtpController,
  checkUserAccessTokenController,
  loginController,
} from '@/app/modules/auth/auth.controllers';
import { validateReqBody } from '@/app/utils/system.utils';
import {
  checkAccessTokenSchema,
  signupSchema,
  verifySignupUserSchema,
  loginSchema,
} from '@/app/modules/auth/auth.schema';
import {
  checkOtpMiddleware,
  checkOtpPageTokenMiddleware,
  checkSignupUserExistsMiddleware,
  checkUserExistenceMiddleware,
  checkUserAccessTokenMiddleware,
} from '@/app/modules/auth/auth.middlewares';

const router = Router();

router
  .route('/auth/signup')
  .post(
    validateReqBody(signupSchema),
    checkSignupUserExistsMiddleware,
    signupController
  );

router.route('/auth/login').post(validateReqBody(loginSchema), loginController);

router
  .route('/auth/verify')
  .post(
    checkOtpPageTokenMiddleware,
    checkUserExistenceMiddleware,
    validateReqBody(verifySignupUserSchema),
    checkOtpMiddleware,
    verifySignupUserController
  );

router
  .route('/auth/resend')
  .post(
    checkOtpPageTokenMiddleware,
    checkUserExistenceMiddleware,
    resendOtpController
  );

router
  .route('/auth/check')
  .post(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    validateReqBody(checkAccessTokenSchema),
    checkUserAccessTokenController
  );

export default router;
