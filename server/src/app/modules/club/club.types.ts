import { TCreateClubPayload, TUpdateClubPayload, TClubListQuery } from '@/app/modules/club/club.schema';

export interface ICreateClubService {
  userId: string;
  payload: TCreateClubPayload;
}

export interface IUpdateClubService {
  clubId: string;
  userId: string;
  payload: TUpdateClubPayload;
}

export interface IGetClubListService {
  userId: string;
  query: TClubListQuery;
}

export interface IGetClubDetailService {
  clubId: string;
  userId: string;
}
