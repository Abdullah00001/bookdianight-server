import prisma from '@/app/configs/db.configs';
import { IExploreListService, IExploreDetailService, ILightweightExploreItem } from '@/app/modules/explore/explore.types';
import { Prisma } from '@prisma/client';

/**
 * Service for fetching a paginated list of Clubs and Events based on filters.
 * Utilizes complex PostGIS Raw SQL queries.
 * @returns Promise<{ data: ILightweightExploreItem[], total: number }>
 */
export const exploreListService = async ({ query }: IExploreListService) => {
  const { type, lat, lng, minPrice, maxPrice, isPopular, ratings, isVip, search, page, limit, sort, date } = query;
  
  const skip = (page - 1) * limit;

  // Build Club Conditions
  const clubConditions: Prisma.Sql[] = [Prisma.sql`c."deactivatedAt" IS NULL`];
  
  if (lat !== undefined && lng !== undefined) {
    clubConditions.push(Prisma.sql`ST_DWithin(c.geog, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 20000)`);
  }
  if (isVip !== undefined) {
    clubConditions.push(Prisma.sql`c."isVip" = ${isVip}`);
  }
  if (search) {
    clubConditions.push(Prisma.sql`c."name" ILIKE ${`%${search}%`}`);
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    const minP = minPrice ?? 0;
    const maxP = maxPrice ?? 999999999;
    clubConditions.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM "ClubPackage" cp 
        WHERE cp."clubId" = c.id 
        AND cp."isActive" = true 
        AND cp.price >= ${minP} 
        AND cp.price <= ${maxP}
      )
    `);
  }
  if (date) {
    const d = new Date(date);
    const dayOfWeek = d.getUTCDay();
    clubConditions.push(Prisma.sql`
      EXISTS (
        SELECT 1 FROM "ClubOpeningHour" coh 
        WHERE coh."clubId" = c.id 
        AND coh."dayOfWeek" = ${dayOfWeek} 
        AND coh."isClosed" = false
      )
    `);
  }

  const clubWhere = clubConditions.length ? Prisma.sql`WHERE ${Prisma.join(clubConditions, ' AND ')}` : Prisma.empty;
  const clubHaving = ratings ? Prisma.sql`HAVING COALESCE(AVG(r.rating), 0) >= ${ratings}` : Prisma.empty;

  // Build Event Conditions
  const eventConditions: Prisma.Sql[] = [Prisma.sql`e."deactivatedAt" IS NULL`];
  
  if (lat !== undefined && lng !== undefined) {
    eventConditions.push(Prisma.sql`ST_DWithin(e.geog, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 20000)`);
  }
  if (search) {
    eventConditions.push(Prisma.sql`e."eventName" ILIKE ${`%${search}%`}`);
  }
  if (minPrice !== undefined) {
    eventConditions.push(Prisma.sql`e."eventPrice" >= ${minPrice}`);
  }
  if (maxPrice !== undefined) {
    eventConditions.push(Prisma.sql`e."eventPrice" <= ${maxPrice}`);
  }
  if (date) {
    const d = new Date(date);
    eventConditions.push(Prisma.sql`e."startAt" <= ${d} AND e."endAt" >= ${d}`);
  }

  const eventWhere = eventConditions.length ? Prisma.sql`WHERE ${Prisma.join(eventConditions, ' AND ')}` : Prisma.empty;

  const clubQuery = Prisma.sql`
    SELECT c.id, c.name, c.lat, c.lng, 'CLUB' as "type", COALESCE(AVG(r.rating), 0) as review, c."createdAt"
    FROM "Club" c
    LEFT JOIN "ClubReview" r ON c.id = r."clubId"
    ${clubWhere}
    GROUP BY c.id
    ${clubHaving}
  `;

  const eventQuery = Prisma.sql`
    SELECT e.id, e."eventName" as name, e.lat, e.lng, 'EVENT' as "type", 0 as review, e."createdAt"
    FROM "Event" e
    ${eventWhere}
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

  let orderBy = Prisma.sql`ORDER BY "createdAt" DESC`;
  if (isPopular) {
    // Only applies effectively when type=CLUB or mixed, orders by review DESC
    orderBy = Prisma.sql`ORDER BY review DESC NULLS LAST, "createdAt" DESC`;
  } else if (sort === 'oldest') {
    orderBy = Prisma.sql`ORDER BY "createdAt" ASC`;
  } else if (sort === 'newest') {
    orderBy = Prisma.sql`ORDER BY "createdAt" DESC`;
  }

  // Count query
  const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
    WITH combined AS (
      ${combinedQuery}
    )
    SELECT COUNT(*) as count FROM combined
  `;
  const total = Number(countResult[0]?.count || 0);

  // Data query
  const data = await prisma.$queryRaw<{ id: string, name: string, lat: number, lng: number, type: "CLUB" | "EVENT", review: number }[]>`
    WITH combined AS (
      ${combinedQuery}
    )
    SELECT id, name, lat, lng, "type", review FROM combined
    ${orderBy}
    LIMIT ${limit} OFFSET ${skip}
  `;

  const formattedData: ILightweightExploreItem[] = data.map((item) => ({
    id: item.id,
    name: item.name,
    lat: Number(item.lat),
    lng: Number(item.lng),
    type: item.type,
    ...(item.type === 'CLUB' && { review: Number(item.review) })
  }));

  return { data: formattedData, total };
};

/**
 * Service for fetching details of a specific Club or Event.
 * Returns aggregated reviews for Clubs.
 * @returns Promise<Record<string, unknown>>
 */
export const exploreDetailService = async ({ id, query }: IExploreDetailService) => {
  if (query.type === 'CLUB') {
    const club = await prisma.club.findUnique({
      where: { id },
      include: {
        clubOpeningHours: true,
        clubPackages: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
      }
    });

    if (!club || (club as Record<string, unknown>).deactivatedAt !== null) {
      return null;
    }

    const reviewAgg = await prisma.clubReview.aggregate({
      where: { clubId: id },
      _avg: { rating: true },
      _count: { id: true }
    });

    const { userId, createdAt, updatedAt, ...restClub } = club;
    const publicClub = restClub as Record<string, unknown>;
    delete publicClub.deactivatedAt;
    delete publicClub.geog;

    return {
      ...publicClub,
      aggregateRating: reviewAgg._avg.rating || 0,
      totalReviews: reviewAgg._count.id || 0,
    };
  } else {
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event || (event as Record<string, unknown>).deactivatedAt !== null) {
      return null;
    }

    const { userId, createdAt, updatedAt, ...restEvent } = event;
    const publicEvent = restEvent as Record<string, unknown>;
    delete publicEvent.deactivatedAt;
    delete publicEvent.geog;

    return publicEvent;
  }
};
