import prisma from '@/app/configs/db.configs';
import { ICreateReviewService, IGetClubReviewsService, IGetClubReviewsResult } from '@/app/modules/reviews/reviews.types';
import { ClubReview } from '@prisma/client';

/**
 * This service is used to retrieve all reviews of a club
 * @returns Promise<IGetClubReviewsResult | null>
 */
export const getClubReviewsService = async ({
  clubId,
  query,
}: IGetClubReviewsService): Promise<IGetClubReviewsResult> => {
  try {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const reviewAgg = await prisma.clubReview.aggregate({
      where: { clubId },
      _avg: { rating: true },
      _count: { id: true },
    });

    const averageRating = reviewAgg._avg.rating || 0;
    const total = reviewAgg._count.id || 0;

    const reviewsData = await prisma.clubReview.findMany({
      where: { clubId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        review: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            profile: {
              select: {
                profileAvatar: true,
              },
            },
          },
        },
      },
    });

    const reviews = reviewsData.map((r) => ({
      id: r.id,
      rating: r.rating,
      review: r.review,
      createdAt: r.createdAt,
      reviewer: {
        name: r.user.name,
        avatar: r.user.profile?.profileAvatar || null,
      },
    }));

    return {
      total,
      averageRating,
      reviews,
    };
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
