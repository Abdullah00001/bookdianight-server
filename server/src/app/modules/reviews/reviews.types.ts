import { TCreateReviewPayload } from '@/app/modules/reviews/reviews.schema';

export interface ICreateReviewService {
  userId: string;
  payload: TCreateReviewPayload;
}