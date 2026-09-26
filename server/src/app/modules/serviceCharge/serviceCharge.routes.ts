import { Router } from 'express';
import {
  getServiceChargeController,
  updateServiceChargeController,
} from '@/app/modules/serviceCharge/serviceCharge.controllers';
import { validateReqBody } from '@/app/utils/system.utils';
import { updateServiceChargeSchema } from '@/app/modules/serviceCharge/serviceCharge.schema';
import {
  checkAdminAccessTokenMiddleware,
  checkAdminExistenceMiddleware,
  checkCsrfTokenMiddleware,
} from '@/app/modules/admin/admin.middlewares';
import { checkServiceChargeExistenceMiddleware } from '@/app/modules/serviceCharge/serviceCharge.middlewares';

const router = Router();

router
  .route('/service-charge')
  .get(checkServiceChargeExistenceMiddleware, getServiceChargeController);

router
  .route('/admin/service-charge')
  .get(
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    checkServiceChargeExistenceMiddleware,
    getServiceChargeController
  )
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqBody(updateServiceChargeSchema),
    checkServiceChargeExistenceMiddleware,
    updateServiceChargeController
  );

export default router;
