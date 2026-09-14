import prisma from '@/app/configs/db.configs';
import { ICreateEventService, IUpdateEventService } from '@/app/modules/event/event.types';
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
