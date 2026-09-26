import prisma from '@/app/configs/db.configs';
import { ICreateReviewService } from '@/app/modules/reviews/reviews.types';
import { ClubReview } from '@prisma/client';

/**
 * This service is used to retrieve all reviews of a club
 * @returns Promise<void>
 */
export const getClubReviewsService = async (): Promise<void> => {
  try {
    console.log('getClubReviewsService called');
    return;
  } catch (error) {
    throw error;
  }
};

/**
 * This service is used to create a review
 * @param data ICreateReviewService
 * @returns Promise<ClubReview>
 */
export const createReviewService = async ({
  userId,
  payload,
}: ICreateReviewService): Promise<ClubReview> => {
  try {
    const { clubId, rating, review } = payload;

    const clubReview = await prisma.clubReview.create({
      data: {
        userId,
        clubId,
        rating,
        review,
      },
    });

    return clubReview;
  } catch (error) {
    throw error;
  }
};
