import { Router } from 'express';
import {
  getNotificationListController,
  readNotificationController,
  readAllNotificationsController,
  getUnreadNotificationCountController
} from '@/app/modules/notification/notification.controllers';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus
} from '@/app/modules/auth/auth.middlewares';

const router = Router();



router.get('/notifications', checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus, getNotificationListController);
router.get('/notifications/unread-count', checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus, getUnreadNotificationCountController);
router.patch('/notifications/read-all', checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus, readAllNotificationsController);
router.patch('/notifications/:id/read', checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus, readNotificationController);

export default router;
