import { Router } from 'express';
import {
  getUserProfileController,
  updateUserProfileController,
} from '@/app/modules/profile/profile.controllers';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
} from '@/app/modules/auth/auth.middlewares';
import { validateReqBody } from '@/app/utils/system.utils';
import { updateProfileSchema } from '@/app/modules/profile/profile.schema';

const router = Router();

router.route('/profile')
  .get(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    getUserProfileController
  )
  .patch(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    validateReqBody(updateProfileSchema),
    updateUserProfileController
  );

export default router;
