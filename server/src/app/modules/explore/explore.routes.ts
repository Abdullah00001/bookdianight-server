import { Router } from 'express';
import { exploreListController, exploreDetailController } from '@/app/modules/explore/explore.controllers';
import { exploreQuerySchema, exploreDetailQuerySchema, exploreIdParamsSchema } from '@/app/modules/explore/explore.schema';
import { validateReqQuery, validateReqParams } from '@/app/utils/system.utils';


const router = Router();

router.get(
  '/explore',
  validateReqQuery(exploreQuerySchema),
  exploreListController
);

router.get(
  '/explore/:id',
  validateReqParams(exploreIdParamsSchema),
  validateReqQuery(exploreDetailQuerySchema),
  exploreDetailController
);

export default router;
