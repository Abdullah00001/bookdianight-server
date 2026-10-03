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
  getAdminDashboardController,
  getAdminUsersController,
  suspendAdminUserController,
  deleteAdminUserController,
  earningsForAdminController,
} from '@/app/modules/admin/admin.controllers';
import {
  validateReqBody,
  validateReqQuery,
  validateReqParams,
} from '@/app/utils/system.utils';
import {
  adminLoginSchema,
  earningsQuerySchema,
} from '@/app/modules/admin/admin.schema';
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
  getDashboardQuerySchema,
  getAdminUsersQuerySchema,
  adminUserIdParamsSchema,
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

router
  .route('/admin/dashboard')
  .get(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqQuery(getDashboardQuerySchema),
    getAdminDashboardController
  );

router
  .route('/admin/users')
  .get(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqQuery(getAdminUsersQuerySchema),
    getAdminUsersController
  );

router
  .route('/admin/users/:id/suspend')
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqParams(adminUserIdParamsSchema),
    suspendAdminUserController
  );

router
  .route('/admin/users/:id/delete')
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqParams(adminUserIdParamsSchema),
    deleteAdminUserController
  );

router
  .route('/admin/earnings')
  .get(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqQuery(earningsQuerySchema),
    earningsForAdminController
  );

export default router;
