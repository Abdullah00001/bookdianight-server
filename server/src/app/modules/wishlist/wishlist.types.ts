import { TCreateWishlistPayload, TGetWishlistQuery } from '@/app/modules/wishlist/wishlist.schema';
import { ILightweightExploreItem } from '@/app/modules/explore/explore.types';

export interface ICreateWishlistService {
  userId: string;
  payload: TCreateWishlistPayload;
}

export interface IRemoveWishlistService {
  userId: string;
  type: 'CLUB' | 'EVENT';
  targetId: string;
}

export interface IGetWishlistService {
  userId: string;
  query: TGetWishlistQuery;
}

export interface IWishlistListResponse {
  data: ILightweightExploreItem[];
  total: number;
}
