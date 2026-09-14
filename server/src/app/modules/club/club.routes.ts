import { Router } from 'express';
import { createClubController, updateClubController, getClubListController, getClubDetailController } from '@/app/modules/club/club.controllers';
import { createClubSchema, updateClubSchema, clubIdParamsSchema, clubListQuerySchema } from '@/app/modules/club/club.schema';
import { validateReqBody, validateReqParams, validateReqQuery } from '@/app/utils/system.utils';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware
} from '@/app/modules/auth/auth.middlewares';


const router = Router();

router.get(
  '/club',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  validateReqQuery(clubListQuerySchema),
  getClubListController
);

router.get(
  '/club/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  validateReqParams(clubIdParamsSchema),
  getClubDetailController
);

router.post(
  '/club',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  validateReqBody(createClubSchema),
  createClubController
);

router.put(
  '/club/:id',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  checkClubOwnerRoleMiddleware,
  validateReqParams(clubIdParamsSchema),
  validateReqBody(updateClubSchema),
  updateClubController
);

export default router;
