import { Router } from 'express';
import {
  getClubReviewsController,
  createReviewController,
} from '@/app/modules/reviews/reviews.controllers';

const router = Router();

router.route('/reviews').get(getClubReviewsController);

router.route('/reviews').post(createReviewController);

export default router;
