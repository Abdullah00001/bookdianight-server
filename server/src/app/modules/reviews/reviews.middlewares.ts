import { Request, Response, NextFunction } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import prisma from '@/app/configs/db.configs';
import { User } from '@prisma/client';
import { TCreateReviewPayload } from '@/app/modules/reviews/reviews.schema';
import { currentFixedCstWallClock } from '@/app/modules/purchase/purchase.helpers';

export const checkReviewEligibilityMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const { clubId } = req.body as TCreateReviewPayload;

    // 1. Check for Duplicate Review
    const existingReview = await prisma.clubReview.findUnique({
      where: {
        userId_clubId: {
          userId: user.id,
          clubId,
        },
      },
    });

    if (existingReview) {
      res.status(409).json({
        success: false,
        message: 'You have already reviewed this club',
        traceId,
      });
      return;
    }

    // 2. Check Eligibility (Has at least one qualifying, paid, and ended ClubBooking)
    const qualifyingBooking = await prisma.clubBooking.findFirst({
      where: {
        clubId,
        endAt: { lte: currentFixedCstWallClock() },
        order: {
          buyerUserId: user.id,
          status: 'PAID',
        },
      },
    });

    if (!qualifyingBooking) {
      res.status(403).json({
        success: false,
        message: 'You are not eligible to review this club. You must have completed a paid booking first.',
        traceId,
      });
      return;
    }

    next();
  }
);

export const checkPublicClubExistenceMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clubId = req.params.clubId as string;
    
    if (!clubId) {
      return next(); // Will be caught by params validation
    }

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { deactivatedAt: true }
    });

    if (!club || club.deactivatedAt !== null) {
      res.status(404).json({
        success: false,
        message: 'Resource not found',
        traceId: getTraceId(),
      });
      return;
    }

    next();
  }
);
