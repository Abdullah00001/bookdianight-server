import { Router } from 'express';
import { createEventController, updateEventController, getEventListController, getEventDetailController } from '@/app/modules/event/event.controllers';
import { createEventSchema, updateEventSchema, eventIdParamsSchema, eventListQuerySchema } from '@/app/modules/event/event.schema';
import { validateReqBody, validateReqParams, validateReqQuery } from '@/app/utils/system.utils';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware
} from '@/app/modules/auth/auth.middlewares';
import { checkConnectReadinessMiddleware } from '@/app/modules/connect/connect.middlewares';


const router = Router();

router.post(
  '/event',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqBody(createEventSchema),
  createEventController
);

router.put(
  '/event/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqParams(eventIdParamsSchema),
  validateReqBody(updateEventSchema),
  updateEventController
);

router.get(
  '/event',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqQuery(eventListQuerySchema),
  getEventListController
);

router.get(
  '/event/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  checkConnectReadinessMiddleware,
  validateReqParams(eventIdParamsSchema),
  getEventDetailController
);

export default router;
