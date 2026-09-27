import { Router } from 'express';
import {
  getNotificationListController,
  readNotificationController,
  readAllNotificationsController,
  getUnreadNotificationCountController,
} from '@/app/modules/notification/notification.controllers';
import {
  checkUserAccessTokenMiddleware,
  checkUserExistenceMiddleware,
  checkAccountStatus,
} from '@/app/modules/auth/auth.middlewares';

const router = Router();

router
  .route('/notifications')
  .get(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    getNotificationListController
  );
router
  .route('/notifications/unread-count')
  .get(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    getUnreadNotificationCountController
  );
router
  .route('/notifications/read-all')
  .patch(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    readAllNotificationsController
  );
router
  .route('/notifications/:id/read')
  .patch(
    checkUserAccessTokenMiddleware,
    checkUserExistenceMiddleware,
    checkAccountStatus,
    readNotificationController
  );

export default router;
