import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { User } from '@prisma/client';
import { createEventService, updateEventService, getEventListService, getEventDetailService, retrieveEventsForAdminService } from '@/app/modules/event/event.services';
import {
  TCreateEventPayload,
  TUpdateEventPayload,
  TEventListQuery,
  TEventListQueryForAdmin,
} from '@/app/modules/event/event.schema';
import { buildPaginationLinks } from '@/app/modules/explore/explore.helpers';

/**
 * Controller for handling Event creation requests.
 * Calls the createEventService to create a new Event.
 * Returns the created Event and trace ID.
 * @param req
 * @param res
 */
export const createEventController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const payload = req.body as TCreateEventPayload;

    const event = await createEventService({ userId: user.id, payload });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
      traceId,
    });
  }
);

/**
 * Controller for handling Event update requests.
 * Calls the updateEventService to update an existing Event.
 * Returns the updated Event and trace ID.
 * @param req
 * @param res
 */
export const updateEventController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const id = req.params.id as string;
    const payload = req.body as TUpdateEventPayload;

    const trustedCancellationContext = (req as any).trustedCancellationContext;
    const event = await updateEventService({
      eventId: id,
      userId: user.id,
      payload,
      trustedCancellationContext,
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
      traceId,
    });
  }
);

/**
 * Controller for handling Event list requests.
 * @param req
 * @param res
 */
export const getEventListController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const query = (req.validatedQuery || req.query) as TEventListQuery;

    const { data, total } = await getEventListService({
      userId: user.id,
      query,
    });

    const totalPages = Math.ceil(total / query.limit);
    const links = buildPaginationLinks(req, query.page, totalPages);

    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      meta: {
        total,
        totalPages,
        links,
      },
      data,
      traceId,
    });
  }
);

/**
 * Controller for handling Event detail requests.
 * @param req
 * @param res
 */
export const getEventDetailController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const user = req.user as User;
    const id = req.params.id as string;

    const event = await getEventDetailService({ eventId: id, userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Event detail retrieved successfully',
      data: event,
      traceId,
    });
  }
);

/**
 * This controller is used by admin to retrieve all events.
 * @param req
 * @param res
 */
export const retrieveEventsForAdminController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const query = (req.validatedQuery || req.query) as unknown as TEventListQueryForAdmin;
    const { data, total, page, limit } = await retrieveEventsForAdminService({ query });
    
    const totalPages = Math.ceil(total / limit);
    const links = buildPaginationLinks(req, page, totalPages);

    res.status(200).json({
      success: true,
      message: 'All event retrieve successful for admin',
      meta: {
        total,
        totalPages,
        links,
      },
      data,
      traceId
    });
    return;
  }
);
