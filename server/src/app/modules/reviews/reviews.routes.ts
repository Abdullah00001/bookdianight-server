import { Router } from 'express';
import {
  getClubReviewsController,
  createReviewController,
} from '@/app/modules/reviews/reviews.controllers';
import { checkUserAccessTokenMiddleware } from '@/app/modules/auth/auth.middlewares';
import { checkUserExistenceMiddleware } from '@/app/modules/auth/auth.middlewares';
import { checkAccountStatus } from '@/app/modules/auth/auth.middlewares';
import { validateReqBody, validateReqParams, validateReqQuery } from '@/app/utils/system.utils';
import { createReviewSchema, getClubReviewsParamsSchema, getClubReviewsQuerySchema } from '@/app/modules/reviews/reviews.schema';
import { checkReviewEligibilityMiddleware, checkPublicClubExistenceMiddleware } from '@/app/modules/reviews/reviews.middlewares';

const router = Router();

router.route('/:clubId').get(
  validateReqParams(getClubReviewsParamsSchema),
  checkPublicClubExistenceMiddleware,
  validateReqQuery(getClubReviewsQuerySchema),
  getClubReviewsController
);

router.route('/reviews').post(
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  validateReqBody(createReviewSchema),
  checkReviewEligibilityMiddleware,
  createReviewController
);

export default router;
