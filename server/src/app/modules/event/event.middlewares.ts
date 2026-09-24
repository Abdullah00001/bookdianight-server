import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';
import prisma from '@/app/configs/db.configs';
import { asyncHandler } from '@/app/utils/system.utils';

export const checkEventCancellationValidityMiddleware = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const eventId = req.params.id as string;
    const userId = (req.user as User).id;
    const { eventStatus, isActive } = req.body;

    // Fetch current state
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    if (existingEvent.userId !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    // 1. Prevent modification/reactivation of an already CANCELED Event
    if (existingEvent.eventStatus === 'CANCELED') {
      res.status(400).json({
        success: false,
        message:
          'Event is already canceled and cannot be modified or reactivated',
      });
      return;
    }

    // 2. Prevent `isActive` from acting as a cancellation bypass
    if (isActive === false && eventStatus !== 'CANCELED') {
      res.status(400).json({
        success: false,
        message:
          'Deactivating an event requires formal cancellation (eventStatus: CANCELED)',
      });
      return;
    }

    // 3. Process formal cancellation rules
    if (eventStatus === 'CANCELED') {
      const T_MINUS_6H = new Date(
        existingEvent.startAt.getTime() - 6 * 60 * 60 * 1000
      );

      if (new Date() >= T_MINUS_6H) {
        res.status(400).json({
          success: false,
          message: 'Cannot cancel event within 6 hours of its start time',
        });
        return;
      }

      // Establish trusted context for the service
      (req as any).trustedCancellationContext = {
        isCancellation: true,
        cancellationTimestamp: new Date(),
        existingEvent,
      };
    } else {
      (req as any).trustedCancellationContext = {
        isCancellation: false,
        existingEvent,
      };
    }

    next();
  }
);
