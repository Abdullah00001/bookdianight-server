import { Router } from 'express';
import {
  createClubController,
  updateClubController,
  getClubListController,
  getClubDetailController,
  retrieveClubsForAdminController,
} from '@/app/modules/club/club.controllers';
import {
  createClubSchema,
  updateClubSchema,
  clubIdParamsSchema,
  clubListQuerySchema,
  adminClubListQuerySchema,
} from '@/app/modules/club/club.schema';
import {
  validateReqBody,
  validateReqParams,
  validateReqQuery,
} from '@/app/utils/system.utils';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
} from '@/app/modules/auth/auth.middlewares';
import { checkConnectReadinessMiddleware } from '@/app/modules/connect/connect.middlewares';
import {
  checkAdminAccessTokenMiddleware,
  checkAdminExistenceMiddleware,
  checkCsrfTokenMiddleware,
} from '@/app/modules/admin/admin.middlewares';

const router = Router();

router.get(
  '/club',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqQuery(clubListQuerySchema),
  getClubListController
);

router.get(
  '/club/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqParams(clubIdParamsSchema),
  getClubDetailController
);

router.post(
  '/club',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqBody(createClubSchema),
  createClubController
);

router.put(
  '/club/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqParams(clubIdParamsSchema),
  validateReqBody(updateClubSchema),
  updateClubController
);

router
  .route('/admin/club')
  .get(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqQuery(adminClubListQuerySchema),
    retrieveClubsForAdminController
  );

export default router;
