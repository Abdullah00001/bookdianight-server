import { Router } from 'express';
import { createPaymentIntentController } from '@/app/modules/payment/payment.controllers';
import {
  checkAccountStatus,
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
} from '@/app/modules/auth/auth.middlewares';
import {
  requirePaymentIdempotencyKeyMiddleware,
  checkPaymentOrderValidityMiddleware,
} from '@/app/modules/payment/payment.middlewares';
import { createPaymentIntentSchema } from '@/app/modules/payment/payment.schema';
import { validateReqBody } from '@/app/utils/system.utils';

const router = Router();

router
  .route('/payment/intent')
  .post(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    requirePaymentIdempotencyKeyMiddleware,
    validateReqBody(createPaymentIntentSchema),
    checkPaymentOrderValidityMiddleware,
    createPaymentIntentController
  );

export default router;
