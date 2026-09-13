import { Router } from 'express';
import { validateReqBody } from '@/app/utils/system.utils';
import { updateLegalContentSchema } from '@/app/modules/legal/legal.schema';
import {
  checkCsrfTokenMiddleware,
  checkAdminAccessTokenMiddleware,
  checkAdminExistenceMiddleware,
} from '@/app/modules/admin/admin.middlewares';
import {
  getAdminTermsController,
  updateAdminTermsController,
  getAdminPrivacyController,
  updateAdminPrivacyController,
  getAdminAboutUsController,
  updateAdminAboutUsController,
  getTermsController,
  getPrivacyController,
  getAboutUsController,
} from '@/app/modules/legal/legal.controllers';

const router = Router();

// ==========================================
// ADMIN ROUTES
// ==========================================

router
  .route('/admin/terms')
  .get(
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    getAdminTermsController
  )
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqBody(updateLegalContentSchema),
    updateAdminTermsController
  );

router
  .route('/admin/privacy')
  .get(
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    getAdminPrivacyController
  )
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqBody(updateLegalContentSchema),
    updateAdminPrivacyController
  );

router
  .route('/admin/about-us')
  .get(
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    getAdminAboutUsController
  )
  .patch(
    checkCsrfTokenMiddleware,
    checkAdminAccessTokenMiddleware,
    checkAdminExistenceMiddleware,
    validateReqBody(updateLegalContentSchema),
    updateAdminAboutUsController
  );

// ==========================================
// PUBLIC ROUTES
// ==========================================

router.route('/terms').get(getTermsController);
router.route('/privacy').get(getPrivacyController);
router.route('/about-us').get(getAboutUsController);

export default router;
