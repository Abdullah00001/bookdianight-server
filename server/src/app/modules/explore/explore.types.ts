import { TExploreQuery, TExploreDetailQuery } from './explore.schema';


export interface IExploreListService {
  query: TExploreQuery;
}

export interface IExploreDetailService {
  id: string;
  query: TExploreDetailQuery;
}

export interface ILightweightExploreItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'CLUB' | 'EVENT';
  review?: number;
  isVip?: boolean;
  thumbnail: string;
  minPrice?: number;
  maxPrice?: number;
  price?: number;
  currency: string;
}
