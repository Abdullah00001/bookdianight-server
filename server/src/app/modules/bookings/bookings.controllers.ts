import { env } from '@/env';
import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import {
  retrieveLoggedInUserBookingsService,
  retrieveLoggedInUserSingleBookingsService,
  retrieveLoggedInUserTicketService,
  retrieveLoggedInUserTicketFileService,
} from '@/app/modules/bookings/bookings.services';
import {
  TRetrieveLoggedInUserBookingsQuery,
  TRetrieveLoggedInUserSingleBookingsQuery,
} from '@/app/modules/bookings/bookings.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * This controller is used to retrieve all bookings of logged in user
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const retrieveLoggedInUserBookingsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const query = req.validatedQuery as TRetrieveLoggedInUserBookingsQuery;
    const userId = (req.user as User).id;

    const { data, total, totalPages } =
      await retrieveLoggedInUserBookingsService({
        query,
        userId,
      });

    const links = buildPaginationLinks(req, query.page, totalPages);

    res.status(200).json({
      success: true,
      message: 'All bookings retrieve successful',
      data,
      meta: {
        total,
        totalPages,
        links,
      },
      traceId,
    });
    return;
  }
);

/**
 * This controller is used to retrieve single booking of logged in user
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const retrieveLoggedInUserSingleBookingsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const id = req.params.id as string;
    const query =
      req.validatedQuery as TRetrieveLoggedInUserSingleBookingsQuery;
    const userId = (req.user as User).id;

    const data = await retrieveLoggedInUserSingleBookingsService({
      id,
      query,
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'Retrieve single booking successful',
      data,
      traceId,
    });
    return;
  }
);

const ticketErrorMessages = {
  NOT_FOUND: 'Booking not found',
  PENDING: 'Ticket is still being generated',
  FAILED: 'Ticket generation failed',
};

/** Returns the stable authenticated file URL for a generated ticket. */
export const retrieveLoggedInUserTicketController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const id = req.params.id as string;
    const userId = (req.user as User).id;
    const result = await retrieveLoggedInUserTicketService({ id, userId });

    if (result.status !== 'GENERATED') {
      res.status(result.status === 'NOT_FOUND' ? 404 : 409).json({
        success: false,
        message: ticketErrorMessages[result.status],
        traceId,
      });
      return;
    }

    const ticketUrl = `${env.SERVER_URL.replace(/\/+$/, '')}/api/v1/bookings/${id}/ticket/file`;
    res.status(200).json({
      success: true,
      message: 'Ticket retrieved successfully',
      data: { ticketUrl },
      traceId,
    });
  }
);

/** Streams the private PDF to the authenticated booking owner. */
export const retrieveLoggedInUserTicketFileController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const id = req.params.id as string;
    const userId = (req.user as User).id;
    const result = await retrieveLoggedInUserTicketFileService({ id, userId });

    if (result.status !== 'GENERATED') {
      res.status(result.status === 'NOT_FOUND' ? 404 : 409).json({
        success: false,
        message: ticketErrorMessages[result.status],
        traceId,
      });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    const stream = result.data.Body as NodeJS.ReadableStream;
    stream.on('error', (error: Error) => res.destroy(error));
    stream.pipe(res);
  }
);
