import { Router } from 'express';
import {
  retrieveLoggedInUserBookingsController,
  retrieveLoggedInUserSingleBookingsController,
} from '@/app/modules/bookings/bookings.controllers';

const router = Router();

router.route('/bookings').get(retrieveLoggedInUserBookingsController);

router.route('/bookings/:id').get(retrieveLoggedInUserSingleBookingsController);

export default router;
