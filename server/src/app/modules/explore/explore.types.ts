import { TExploreQuery, TExploreDetailQuery } from './explore.schema';

export interface IExploreListService {
  query: TExploreQuery;
  userId?: string;
}

export interface IExploreDetailService {
  id: string;
  query: TExploreDetailQuery;
  userId?: string;
}

export interface ILightweightExploreItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  location: string;
  type: 'CLUB' | 'EVENT';
  review?: number;
  isVip?: boolean;
  thumbnail: string;
  priceRange?: {
    minPrice: number;
    maxPrice: number;
  };
  price?: number;
  currency: string;
  isWishlist?: boolean;
}
