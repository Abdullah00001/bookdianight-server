import { Router } from 'express';
import authRoutes from '@/app/modules/auth/auth.routes';
import mediaRoutes from '@/app/modules/media/media.routes';
import recoverRoutes from '@/app/modules/recover/recover.routes';
import adminRoutes from '@/app/modules/admin/admin.routes';
import profileRoutes from '@/app/modules/profile/profile.routes';
import legalRoutes from '@/app/modules/legal/legal.routes';
import clubRoutes from '@/app/modules/club/club.routes';
import eventRoutes from '@/app/modules/event/event.routes';
import exploreRoutes from '@/app/modules/explore/explore.routes';
import wishlistRoutes from '@/app/modules/wishlist/wishlist.routes';
import serviceChargeRoutes from '@/app/modules/serviceCharge/serviceCharge.routes';
import connectRoutes from '@/app/modules/connect/connect.routes';
import purchaseRoutes from '@/app/modules/purchase/purchase.routes';
import paymentRoutes from '@/app/modules/payment/payment.routes';
import webhookRoutes from '@/app/modules/webhook/webhook.routes';
import bookingsRoutes from '@/app/modules/bookings/bookings.routes';
import reviewsRoutes from '@/app/modules/reviews/reviews.routes';
const routes: Router[] = [
  reviewsRoutes,
  bookingsRoutes,
  webhookRoutes,
  paymentRoutes,
  purchaseRoutes,
  connectRoutes,
  serviceChargeRoutes,
  wishlistRoutes,
  exploreRoutes,
  eventRoutes,
  clubRoutes,
  legalRoutes,
  profileRoutes,
  adminRoutes,
  recoverRoutes,
  mediaRoutes,
  authRoutes,
 
];

const v1Routes = Router();

routes.forEach((route) => v1Routes.use(route));

export default v1Routes;
