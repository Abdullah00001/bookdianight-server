import { TCreateReviewPayload, TGetClubReviewsQuery } from '@/app/modules/reviews/reviews.schema';

export interface ICreateReviewService {
  userId: string;
  payload: TCreateReviewPayload;
}

export interface IGetClubReviewsService {
  clubId: string;
  query: TGetClubReviewsQuery;
}

export interface IClubReviewItem {
  id: string;
  rating: number;
  review: string | null;
  createdAt: Date;
  reviewer: {
    name: string;
    avatar: string | null;
  };
}

export interface IGetClubReviewsResult {
  total: number;
  averageRating: number;
  reviews: IClubReviewItem[];
}