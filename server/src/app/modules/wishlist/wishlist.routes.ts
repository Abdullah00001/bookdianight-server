import { Router } from 'express';
import {
  createWishlistController,
  removeWishlistController,
  getWishlistController,
} from '@/app/modules/wishlist/wishlist.controllers';
import {
  validateReqBody,
  validateReqQuery,
  validateReqParams,
} from '@/app/utils/system.utils';
import {
  createWishlistSchema,
  getWishlistQuerySchema,
  removeWishlistParamsSchema,
} from '@/app/modules/wishlist/wishlist.schema';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
} from '@/app/modules/auth/auth.middlewares';

const router = Router();

router.post(
  '/wishlist',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  validateReqBody(createWishlistSchema),
  createWishlistController
);

router.delete(
  '/wishlist/:type/:targetId',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  validateReqParams(removeWishlistParamsSchema),
  removeWishlistController
);

router.get(
  '/wishlist',
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
  validateReqQuery(getWishlistQuerySchema),
  getWishlistController
);

export default router;
