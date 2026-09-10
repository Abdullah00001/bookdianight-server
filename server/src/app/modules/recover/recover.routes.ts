import { Router } from 'express';
import {
  findRecoverUserController,
  verifyRecoverUserController,
  recoverUserPasswordResetController,
  recoverUserVerificationOtpResendController,
} from '@/app/modules/recover/recover.controllers';
import {
  checkOtpMiddleware,
  findUserByEmail,
} from '@/app/modules/auth/auth.middlewares';
import { checkResetPasswordPageTokenMiddleware } from '@/app/modules/recover/recover.middlewares';

const router = Router();

router.route('/recover/find').post(findUserByEmail, findRecoverUserController);

router
  .route('/recover/verify')
  .post(
    checkResetPasswordPageTokenMiddleware,
    checkOtpMiddleware,
    verifyRecoverUserController
  );

router
  .route('/recover/reset')
  .post(
    checkResetPasswordPageTokenMiddleware,
    recoverUserPasswordResetController
  );

router
  .route('/recover/resend')
  .post(
    checkResetPasswordPageTokenMiddleware,
    recoverUserVerificationOtpResendController
  );

export default router;
