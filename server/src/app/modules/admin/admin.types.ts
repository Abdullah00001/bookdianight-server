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

import { TUpdateAdminProfilePayload } from '@/app/modules/admin/admin.schema';

export interface IGetAdminProfileService {
  userId: string;
}

export interface IUpdateAdminProfileService {
  userId: string;
  payload: TUpdateAdminProfilePayload;
}

import {
  TChangeAdminPasswordPayload,
  TUpdateCommissionPayload,
} from '@/app/modules/admin/admin.schema';

export interface IChangeAdminPasswordService {
  userId: string;
  payload: TChangeAdminPasswordPayload;
}

export interface IUpdateCommissionService {
  payload: TUpdateCommissionPayload;
}
