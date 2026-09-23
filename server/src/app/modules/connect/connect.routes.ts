import { raw, Router } from 'express';
import {
  createOrResumeConnectOnboardingController,
  getConnectStatusController,
  refreshConnectOnboardingController,
  returnFromConnectOnboardingController,
  connectWebhookController,
} from '@/app/modules/connect/connect.controllers';
import {
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
} from '@/app/modules/auth/auth.middlewares';
import { checkConnectCallbackTokenMiddleware } from '@/app/modules/connect/connect.middlewares';
import { validateReqQuery } from '@/app/utils/system.utils';
import { connectCallbackQuerySchema } from '@/app/modules/connect/connect.schema';

const router = Router();

router
  .route('/connect/onboarding')
  .post(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    checkClubOwnerRoleMiddleware,
    createOrResumeConnectOnboardingController
  );

router
  .route('/connect/status')
  .get(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    checkClubOwnerRoleMiddleware,
    getConnectStatusController
  );
router.get(
  '/connect/return',
  validateReqQuery(connectCallbackQuerySchema),
  checkConnectCallbackTokenMiddleware,
  returnFromConnectOnboardingController
);
router.get(
  '/connect/refresh',
  validateReqQuery(connectCallbackQuerySchema),
  checkConnectCallbackTokenMiddleware,
  refreshConnectOnboardingController
);
router.post(
  '/connect/webhook',
  raw({ type: 'application/json' }),
  connectWebhookController
);

export default router;
