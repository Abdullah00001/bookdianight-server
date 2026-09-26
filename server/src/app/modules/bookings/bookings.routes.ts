import { Router } from 'express';
import { validateReqQuery, validateReqParams } from '@/app/utils/system.utils';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
} from '@/app/modules/auth/auth.middlewares';
import {
  retrieveLoggedInUserBookingsQuerySchema,
  retrieveLoggedInUserSingleBookingsQuerySchema,
  retrieveLoggedInUserSingleBookingsParamsSchema,
} from '@/app/modules/bookings/bookings.schema';
import {
  retrieveLoggedInUserBookingsController,
  retrieveLoggedInUserSingleBookingsController,
} from '@/app/modules/bookings/bookings.controllers';
import { checkBookingExistenceAndOwnershipMiddleware } from '@/app/modules/bookings/bookings.middlewares';

const router = Router();

router
  .route('/bookings')
  .get(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    validateReqQuery(retrieveLoggedInUserBookingsQuerySchema),
    retrieveLoggedInUserBookingsController
  );

router
  .route('/bookings/:id')
  .get(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    validateReqParams(retrieveLoggedInUserSingleBookingsParamsSchema),
    validateReqQuery(retrieveLoggedInUserSingleBookingsQuerySchema),
    checkBookingExistenceAndOwnershipMiddleware,
    retrieveLoggedInUserSingleBookingsController
  );

export default router;
