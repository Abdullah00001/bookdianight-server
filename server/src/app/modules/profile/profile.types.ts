import { TUpdateProfilePayload } from '@/app/modules/profile/profile.schema';

export interface IGetUserProfileService {
  userId: string;
}

export interface IUpdateUserProfileService {
  userId: string;
  payload: TUpdateProfilePayload;
}
