import { TAdminLoginPayload } from '@/app/modules/admin/admin.schema';
import { User } from '@prisma/client';

export interface ILoginAdminService {
  user: User;
  payload: TAdminLoginPayload;
}

export interface ICheckAdminService {
  user: User;
}

export interface IRefreshAdminService {
  user: User;
  refreshToken: string;
}

export interface ILogoutAdminService {
  user: User;
  accessToken: string;
  refreshToken?: string;
}
