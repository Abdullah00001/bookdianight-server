import prisma from '@/app/configs/db.configs';
import { ICreateEventService, IUpdateEventService, IGetEventListService, IGetEventDetailService } from '@/app/modules/event/event.types';
import { Event } from '@prisma/client';

/**
 * Service for creating an Event.
 * Executes a transaction to insert the Event and set its PostGIS geography.
 * @returns Promise<Event>
 */
export const createEventService = async ({ userId, payload }: ICreateEventService): Promise<Event> => {
  return await prisma.$transaction(async (tx) => {
    // 1. Create the Event record
    const event = await tx.event.create({
      data: {
        ...payload,
        userId,
      },
    });

    // 2. Set the PostGIS geography point using raw SQL
    await tx.$executeRaw`
      UPDATE "Event" 
      SET geog = ST_SetSRID(ST_MakePoint(${payload.lng}, ${payload.lat}), 4326)::geography 
      WHERE id = ${event.id}
    `;

    return event;
  });
};

/**
 * Service for updating an Event.
 * Validates ownership, updates the Event, and updates the PostGIS geography if location changed.
 * Also handles implicit logical deactivation.
 * @returns Promise<Event>
 */
export const updateEventService = async ({ eventId, userId, payload }: IUpdateEventService): Promise<Event> => {
  const { isActive, ...eventData } = payload;

  // Verify ownership and existence
  await prisma.event.findUniqueOrThrow({
    where: { id: eventId, userId },
  });

  // Handle explicit isActive toggling to deactivatedAt
  let deactivatedAt: Date | null | undefined = undefined;
  if (isActive === false) {
    deactivatedAt = new Date();
  } else if (isActive === true) {
    deactivatedAt = null;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update the Event record
    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: {
        ...eventData,
        ...(deactivatedAt !== undefined && { deactivatedAt }),
      },
    });

    // 2. Update PostGIS geography point if lat/lng changed
    if (eventData.lat !== undefined && eventData.lng !== undefined) {
      await tx.$executeRaw`
        UPDATE "Event" 
        SET geog = ST_SetSRID(ST_MakePoint(${eventData.lng}, ${eventData.lat}), 4326)::geography 
        WHERE id = ${eventId}
      `;
    }

    return updatedEvent;
  });
};

/**
 * Service for fetching a paginated list of Events belonging to an owner.
 * @returns Promise<{ data: Event[], total: number }>
 */
export const getEventListService = async ({ userId, query }: IGetEventListService) => {
  const { page, limit, eventStatus, isActive } = query;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (eventStatus !== undefined) {
    where.eventStatus = eventStatus;
  }
  if (isActive !== undefined) {
    where.deactivatedAt = isActive ? null : { not: null };
  }

  const [total, data] = await prisma.$transaction([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
  ]);

  return { data, total };
};

/**
 * Service for fetching full details of a specific Event belonging to an owner.
 * @returns Promise<Event>
 */
export const getEventDetailService = async ({ eventId, userId }: IGetEventDetailService): Promise<Event> => {
  return await prisma.event.findUniqueOrThrow({
    where: { id: eventId, userId }
  });
};
