import prisma from '@/app/configs/db.configs';
import { ICreateWishlistService, IRemoveWishlistService, IGetWishlistService, IWishlistListResponse } from '@/app/modules/wishlist/wishlist.types';
import { Prisma } from '@prisma/client';
import { ILightweightExploreItem } from '@/app/modules/explore/explore.types';

/**
 * Service for adding a Club or Event to a user's wishlist.
 * Verifies that the target exists and is active/upcoming before inserting.
 * Employs idempotent logic to handle duplicate saves gracefully.
 * @returns Promise<{ success: boolean }>
 */
export const createWishlistService = async ({ userId, payload }: ICreateWishlistService) => {
  const { type, targetId } = payload;

  if (type === 'CLUB') {
    const club = await prisma.club.findFirst({
      where: { id: targetId, deactivatedAt: null }
    });
    if (!club) {
      throw { status: 404, message: 'Club not found or unavailable' };
    }
    
    // Idempotent upsert logic
    const existing = await prisma.wishlist.findUnique({
      where: { userId_clubId: { userId, clubId: targetId } }
    });
    if (!existing) {
      await prisma.wishlist.create({
        data: { userId, clubId: targetId }
      });
    }
  } else if (type === 'EVENT') {
    const event = await prisma.event.findFirst({
      where: { id: targetId, deactivatedAt: null, eventStatus: 'UPCOMING' }
    });
    if (!event) {
      throw { status: 404, message: 'Event not found or unavailable' };
    }
    
    const existing = await prisma.wishlist.findUnique({
      where: { userId_eventId: { userId, eventId: targetId } }
    });
    if (!existing) {
      await prisma.wishlist.create({
        data: { userId, eventId: targetId }
      });
    }
  }

  return { success: true };
};

/**
 * Service for removing a Club or Event from a user's wishlist.
 * Operates idempotently without enforcing availability checks, ensuring stale records remain deletable.
 * @returns Promise<{ success: boolean }>
 */
export const removeWishlistService = async ({ userId, type, targetId }: IRemoveWishlistService) => {
  if (type === 'CLUB') {
    await prisma.wishlist.deleteMany({
      where: { userId, clubId: targetId }
    });
  } else if (type === 'EVENT') {
    await prisma.wishlist.deleteMany({
      where: { userId, eventId: targetId }
    });
  }
  return { success: true };
};

/**
 * Service for fetching a user's wishlist items.
 * Executes a raw SQL UNION query to retrieve paginated, mixed lists of Clubs and Events.
 * Automatically filters out deactivated Clubs and non-upcoming/deactivated Events.
 * @returns Promise<IWishlistListResponse>
 */
export const getWishlistService = async ({ userId, query }: IGetWishlistService): Promise<IWishlistListResponse> => {
  const type = query.type;
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const skip = (page - 1) * limit;

  const clubQuery = Prisma.sql`
    SELECT 
      c.id, c.name, c.lat, c.lng, c.location, 'CLUB' as "type",
      COALESCE(AVG(r.rating), 0) as review, w."createdAt",
      c."isVip", c.thumbnail, 
      COALESCE((SELECT MIN(price) FROM "ClubPackage" WHERE "clubId" = c.id AND "isActive" = true), 0) as "minPrice",
      COALESCE((SELECT MAX(price) FROM "ClubPackage" WHERE "clubId" = c.id AND "isActive" = true), 0) as "maxPrice",
      (SELECT currency FROM "ClubPackage" WHERE "clubId" = c.id AND "isActive" = true LIMIT 1) as currency
    FROM "Wishlist" w
    JOIN "Club" c ON w."clubId" = c.id
    LEFT JOIN "ClubReview" r ON c.id = r."clubId"
    WHERE w."userId" = ${userId} AND c."deactivatedAt" IS NULL
    GROUP BY c.id, w."createdAt"
  `;

  const eventQuery = Prisma.sql`
    SELECT 
      e.id, e."eventName" as name, e.lat, e.lng, e.location, 'EVENT' as "type",
      0 as review, w."createdAt",
      false as "isVip", e.thumbnail, 
      e."eventPrice" as "minPrice", 
      e."eventPrice" as "maxPrice", 
      e.currency
    FROM "Wishlist" w
    JOIN "Event" e ON w."eventId" = e.id
    WHERE w."userId" = ${userId} AND e."deactivatedAt" IS NULL AND e."eventStatus" = 'UPCOMING'
  `;

  let combinedQuery: Prisma.Sql;
  if (type === 'CLUB') {
    combinedQuery = clubQuery;
  } else if (type === 'EVENT') {
    combinedQuery = eventQuery;
  } else {
    combinedQuery = Prisma.sql`
      ${clubQuery}
      UNION ALL
      ${eventQuery}
    `;
  }

  const orderBy = Prisma.sql`ORDER BY "createdAt" DESC`;

  // Count query
  const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
    WITH combined AS (
      ${combinedQuery}
    )
    SELECT COUNT(*) as count FROM combined
  `;
  const total = Number(countResult[0]?.count || 0);

  // Data query
  const data = await prisma.$queryRaw<{ 
    id: string, name: string, lat: number, lng: number, location: string, type: "CLUB" | "EVENT",
    review: number, isVip: boolean, thumbnail: string, minPrice: number, maxPrice: number, currency: string 
  }[]>`
    WITH combined AS (
      ${combinedQuery}
    )
    SELECT id, name, lat, lng, location, "type", review, "isVip", thumbnail, "minPrice", "maxPrice", currency FROM combined
    ${orderBy}
    LIMIT ${limit} OFFSET ${skip}
  `;

  const formattedData: ILightweightExploreItem[] = data.map((item) => {
    const base = {
      id: item.id,
      name: item.name,
      lat: Number(item.lat),
      lng: Number(item.lng),
      location: item.location,
      type: item.type,
      thumbnail: item.thumbnail,
      currency: item.currency || '',
      isWishlist: true,
    };

    if (item.type === 'CLUB') {
      return {
        ...base,
        review: Number(item.review),
        isVip: Boolean(item.isVip),
        priceRange: {
          minPrice: Number(item.minPrice),
          maxPrice: Number(item.maxPrice),
        },
      };
    } else {
      return {
        ...base,
        price: Number(item.minPrice),
      };
    }
  });

  return { data: formattedData, total };
};
