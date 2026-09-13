import { Router } from 'express';
import {
  loginAdminController,
  checkAdminController,
  refreshAdminController,
  logoutAdminController,
  getAdminProfileController,
  updateAdminProfileController,
  changeAdminPasswordController,
  updateCommissionController,
  getCommissionController,
} from '@/app/modules/admin/admin.controllers';
import { validateReqBody } from '@/app/utils/system.utils';
import { adminLoginSchema } from '@/app/modules/admin/admin.schema';
import {
  checkCsrfTokenMiddleware,
  checkAdminAccessTokenMiddleware,
  checkAdminRefreshTokenMiddleware,
  checkAdminExistenceMiddleware,
  checkAdminRoleMiddleware,
} from '@/app/modules/admin/admin.middlewares';
import {
  findUserByEmail,
  checkAccountStatus,
  checkPassword,
} from '@/app/modules/auth/auth.middlewares';
import {
  updateAdminProfileSchema,
  changeAdminPasswordSchema,
  updateCommissionSchema,
} from '@/app/modules/admin/admin.schema';

const router = Router();

router
  .route('/admin/auth/login')
  .post(
    validateReqBody(adminLoginSchema),
    findUserByEmail,
    checkAdminRoleMiddleware,
    checkAccountStatus,
    checkPassword,
    loginAdminController
  );

router
  .route('/admin/auth/check')
  .post(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    checkAdminController
  );

router
  .route('/admin/auth/refresh')
  .post(
    checkCsrfTokenMiddleware,
    checkAdminRefreshTokenMiddleware,
    checkAdminExistenceMiddleware,
    refreshAdminController
  );

router
  .route('/admin/auth/logout')
  .post(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    logoutAdminController
  );

router
  .route('/admin/profile')
  .get(
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    getAdminProfileController
  )
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqBody(updateAdminProfileSchema),
    updateAdminProfileController
  );

router
  .route('/admin/change-password')
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqBody(changeAdminPasswordSchema),
    changeAdminPasswordController
  );

router
  .route('/admin/commission')
  .get(
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    getCommissionController
  )
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqBody(updateCommissionSchema),
    updateCommissionController
  );

export default router;
