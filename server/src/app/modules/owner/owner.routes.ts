import { Router } from 'express';
import { getOwnerDashboardController, getOwnerEarningsController, getOwnerPaymentsController, verifyTicketController } from '@/app/modules/owner/owner.controllers';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
} from '@/app/modules/auth/auth.middlewares';
import { checkConnectReadinessMiddleware } from '@/app/modules/connect/connect.middlewares';
import { validateReqQuery, validateReqBody } from '@/app/utils/system.utils';
import { ownerEarningsQuerySchema, ownerPaymentsQuerySchema, verifyTicketSchema } from '@/app/modules/owner/owner.schema';

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

router.route('/owner/verify-ticket').post(
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  validateReqBody(verifyTicketSchema),
  verifyTicketController
);

export default router;
