import { Router } from 'express';
import { createEventController, updateEventController } from '@/app/modules/event/event.controllers';
import { createEventSchema, updateEventSchema, eventIdParamsSchema } from '@/app/modules/event/event.schema';
import { validateReqBody, validateReqParams } from '@/app/utils/system.utils';
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

export default router;
