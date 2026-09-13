import {
  TUpdateProfilePayload,
  TChangePasswordPayload,
} from '@/app/modules/profile/profile.schema';

export interface IGetUserProfileService {
  userId: string;
}

export interface IUpdateUserProfileService {
  userId: string;
  payload: TUpdateProfilePayload;
}

export interface IChangePasswordService {
  userId: string;
  payload: TChangePasswordPayload;
}
