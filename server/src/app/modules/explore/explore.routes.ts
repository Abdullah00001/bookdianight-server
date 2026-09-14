import { Router } from 'express';
import { exploreListController, exploreDetailController } from '@/app/modules/explore/explore.controllers';
import { exploreQuerySchema, exploreDetailQuerySchema, exploreIdParamsSchema } from '@/app/modules/explore/explore.schema';
import { validateReqQuery, validateReqParams } from '@/app/utils/system.utils';
import { optionalUserAccessTokenMiddleware } from '@/app/modules/auth/auth.middlewares';

const router = Router();

router.get(
  '/explore',
  optionalUserAccessTokenMiddleware,
  validateReqQuery(exploreQuerySchema),
  exploreListController
);

router.get(
  '/explore/:id',
  optionalUserAccessTokenMiddleware,
  validateReqParams(exploreIdParamsSchema),
  validateReqQuery(exploreDetailQuerySchema),
  exploreDetailController
);

export default router;
