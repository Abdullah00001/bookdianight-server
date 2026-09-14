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


const router = Router();

router.post(
  '/event',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  validateReqBody(createEventSchema),
  createEventController
);

router.put(
  '/event/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
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
  validateReqQuery(eventListQuerySchema),
  getEventListController
);

router.get(
  '/event/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  validateReqParams(eventIdParamsSchema),
  getEventDetailController
);

export default router;
