import { Router } from 'express';
import { signupController } from '@/app/modules/auth/auth.controllers';
import { validateReqBody } from '@/app/utils/system.utils';
import { signupSchema } from '@/app/modules/auth/auth.schema';
import { checkSignupUserExists } from '@/app/modules/auth/auth.middlewares';

const router = Router();

router
  .route('/auth/signup')
  .post(validateReqBody(signupSchema), checkSignupUserExists, signupController);

export default router;
