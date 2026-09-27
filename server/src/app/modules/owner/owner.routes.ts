import { Router } from 'express';
import { getOwnerDashboardController, getOwnerEarningsController, getOwnerPaymentsController } from '@/app/modules/owner/owner.controllers';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
} from '@/app/modules/auth/auth.middlewares';
import { checkConnectReadinessMiddleware } from '@/app/modules/connect/connect.middlewares';
import { validateReqQuery } from '@/app/utils/system.utils';
import { ownerEarningsQuerySchema, ownerPaymentsQuerySchema } from '@/app/modules/owner/owner.schema';

const router = Router();

router.route('/owner/dashboard').get(
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  getOwnerDashboardController
);

router.route('/owner/earnings').get(
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqQuery(ownerEarningsQuerySchema),
  getOwnerEarningsController
);

router.route('/owner/payments').get(
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqQuery(ownerPaymentsQuerySchema),
  getOwnerPaymentsController
);

export default router;
