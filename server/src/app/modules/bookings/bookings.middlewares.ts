import { Request, Response, NextFunction } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import prisma from '@/app/configs/db.configs';
import { User } from '@prisma/client';

/**
 * Middleware to check if a single booking exists and belongs to the authenticated user.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const checkBookingExistenceAndOwnershipMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const id = req.params.id as string;
    const type = req.query.type as string;
    const userId = (req.user as User).id;

    if (type === 'CLUB') {
      const clubBooking = await prisma.clubBooking.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!clubBooking || clubBooking.order.buyerUserId !== userId) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
          traceId,
        });
        return;
      }
    } else if (type === 'EVENT') {
      const eventPurchase = await prisma.eventPurchase.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!eventPurchase || eventPurchase.order.buyerUserId !== userId) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
          traceId,
        });
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid type parameter',
        traceId,
      });
      return;
    }

    next();
  }
);

/**
 * Middleware to check if a booking ticket exists and belongs to the authenticated user.
 * It checks both ClubBooking and EventPurchase without requiring a type parameter.
 * @param req Request
 * @param res Response
 * @param next NextFunction
 */
export const checkTicketBookingExistenceAndOwnershipMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const traceId = getTraceId();
    const id = req.params.id as string;
    const userId = (req.user as User).id;

    const [clubBooking, eventPurchase] = await Promise.all([
      prisma.clubBooking.findUnique({
        where: { id },
        include: { order: true },
      }),
      prisma.eventPurchase.findUnique({
        where: { id },
        include: { order: true },
      }),
    ]);

    const booking = clubBooking || eventPurchase;

    if (!booking || booking.order.buyerUserId !== userId) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
        traceId,
      });
      return;
    }

    next();
  }
);
