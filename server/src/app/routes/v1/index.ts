import { Router } from 'express';
import authRoutes from '@/app/modules/auth/auth.routes';
import mediaRoutes from '@/app/modules/media/media.routes';
import recoverRoutes from '@/app/modules/recover/recover.routes';
import adminRoutes from '@/app/modules/admin/admin.routes';
import profileRoutes from '@/app/modules/profile/profile.routes';
import legalRoutes from '@/app/modules/legal/legal.routes';

const routes: Router[] = [
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
