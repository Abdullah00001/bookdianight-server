import { Router } from 'express';
import {
  signupController,
  verifySignupUserController,
  resendOtpController,
  checkUserAccessTokenController,
  loginController,
  logoutController,
} from '@/app/modules/auth/auth.controllers';
import { validateReqBody } from '@/app/utils/system.utils';
import {
  checkAccessTokenSchema,
  signupSchema,
  verifySignupUserSchema,
  loginSchema,
  logoutSchema,
} from '@/app/modules/auth/auth.schema';
import {
  checkOtpMiddleware,
  checkOtpPageTokenMiddleware,
  checkSignupUserExistsMiddleware,
  checkUserExistenceMiddleware,
  checkUserAccessTokenMiddleware,
  checkPassword,
  findUserByEmail,
  checkAccountStatus,
  checkDeviceContextMiddleware,
} from '@/app/modules/auth/auth.middlewares';

const router = Router();

router
  .route('/auth/signup')
  .post(
    validateReqBody(signupSchema),
    checkSignupUserExistsMiddleware,
    signupController
  );

router
  .route('/auth/login')
  .post(
    validateReqBody(loginSchema),
    findUserByEmail,
    checkAccountStatus,
    checkPassword,
    loginController
  );

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
    validateReqBody(checkAccessTokenSchema),
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    checkDeviceContextMiddleware,
    checkUserAccessTokenController
  );

router
  .route('/auth/logout')
  .post(
    validateReqBody(logoutSchema),
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    checkDeviceContextMiddleware,
    logoutController
  );

export default router;
