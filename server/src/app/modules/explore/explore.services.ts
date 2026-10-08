import prisma from '@/app/configs/db.configs';
import { IExploreListService, IExploreDetailService, ILightweightExploreItem } from '@/app/modules/explore/explore.types';
import { Prisma } from '@prisma/client';

/**
 * Service for fetching a paginated list of Clubs and Events based on filters.
 * Utilizes complex PostGIS Raw SQL queries.
 * @returns Promise<{ data: ILightweightExploreItem[], total: number }>
 */
export const exploreListService = async ({ query, userId }: IExploreListService) => {
  const { type, lat, lng, minPrice, maxPrice, isPopular, ratings, isVip, search, sort, date } = query;
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
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
  const eventConditions: Prisma.Sql[] = [
    Prisma.sql`e."deactivatedAt" IS NULL`,
    Prisma.sql`e."eventStatus" = 'UPCOMING'`,
    Prisma.sql`e."endAt" > ${new Date()}`
  ];
  
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

  const wishlistSubqueryClub = userId
    ? Prisma.sql`, EXISTS(SELECT 1 FROM "Wishlist" w WHERE w."clubId" = c.id AND w."userId" = ${userId}) as "isWishlist"`
    : Prisma.empty;

  const wishlistSubqueryEvent = userId
    ? Prisma.sql`, EXISTS(SELECT 1 FROM "Wishlist" w WHERE w."eventId" = e.id AND w."userId" = ${userId}) as "isWishlist"`
    : Prisma.empty;

  const clubQuery = Prisma.sql`
    SELECT 
      c.id, c.name, c.lat, c.lng, c.location, 'CLUB' as "type",
      COALESCE(AVG(r.rating), 0) as review, c."createdAt",
      c."isVip", c.thumbnail, 
      COALESCE((SELECT MIN(price) FROM "ClubPackage" WHERE "clubId" = c.id AND "isActive" = true), 0) as "minPrice",
      COALESCE((SELECT MAX(price) FROM "ClubPackage" WHERE "clubId" = c.id AND "isActive" = true), 0) as "maxPrice",
      (SELECT currency FROM "ClubPackage" WHERE "clubId" = c.id AND "isActive" = true LIMIT 1) as currency
      ${wishlistSubqueryClub}
    FROM "Club" c
    LEFT JOIN "ClubReview" r ON c.id = r."clubId"
    ${clubWhere}
    GROUP BY c.id
    ${clubHaving}
  `;

  const eventQuery = Prisma.sql`
    SELECT 
      e.id, e."eventName" as name, e.lat, e.lng, e.location, 'EVENT' as "type",
      0 as review, e."createdAt",
      false as "isVip", e.thumbnail, 
      e."eventPrice" as "minPrice", 
      e."eventPrice" as "maxPrice", 
      e.currency
      ${wishlistSubqueryEvent}
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

  const selectWishlist = userId ? Prisma.sql`, "isWishlist"` : Prisma.empty;

  // Data query
  const data = await prisma.$queryRaw<{ 
    id: string, name: string, lat: number, lng: number, location: string, type: "CLUB" | "EVENT",
    review: number, isVip: boolean, thumbnail: string, minPrice: number, maxPrice: number, currency: string,
    isWishlist?: boolean
  }[]>`
    WITH combined AS (
      ${combinedQuery}
    )
    SELECT id, name, lat, lng, location, "type", review, "isVip", thumbnail, "minPrice", "maxPrice", currency${selectWishlist} FROM combined
    ${orderBy}
    LIMIT ${limit} OFFSET ${skip}
  `;

  const formattedData: ILightweightExploreItem[] = data.map((item) => {
    const base: ILightweightExploreItem = {
      id: item.id,
      name: item.name,
      lat: Number(item.lat),
      lng: Number(item.lng),
      location: item.location,
      type: item.type,
      thumbnail: item.thumbnail,
      currency: item.currency || '',
    };

    if (userId !== undefined) {
      base.isWishlist = Boolean(item.isWishlist);
    }

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
        price: Number(item.minPrice), // minPrice acts as the price placeholder for Events
      };
    }
  });

  return { data: formattedData, total };
};

/**
 * Service for fetching details of a specific Club or Event.
 * Returns aggregated reviews for Clubs.
 * @returns Promise<Record<string, unknown>>
 */
export const exploreDetailService = async ({ id, query, userId }: IExploreDetailService) => {
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

    let isWishlist: boolean | undefined = undefined;
    if (userId) {
      const wishlistEntry = await prisma.wishlist.findUnique({
        where: { userId_clubId: { userId, clubId: id } }
      });
      isWishlist = Boolean(wishlistEntry);
    }

    const { userId: ownerUserId, createdAt, updatedAt, ...restClub } = club;
    const publicClub = restClub as Record<string, unknown>;
    delete publicClub.deactivatedAt;
    delete publicClub.geog;

    return {
      ...publicClub,
      aggregateRating: reviewAgg._avg.rating || 0,
      totalReviews: reviewAgg._count.id || 0,
      ...(isWishlist !== undefined ? { isWishlist } : {}),
    };
  } else {
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event || (event as Record<string, unknown>).deactivatedAt !== null) {
      return null;
    }

    let isWishlist: boolean | undefined = undefined;
    if (userId) {
      const wishlistEntry = await prisma.wishlist.findUnique({
        where: { userId_eventId: { userId, eventId: id } }
      });
      isWishlist = Boolean(wishlistEntry);
    }

    const { userId: ownerUserId, createdAt, updatedAt, ...restEvent } = event;
    const publicEvent = restEvent as Record<string, unknown>;
    delete publicEvent.deactivatedAt;
    delete publicEvent.geog;

    return {
      ...publicEvent,
      ...(isWishlist !== undefined ? { isWishlist } : {}),
    };
  }
};

export const getSharePreviewHtmlService = async ({ id, type }: { id: string, type: 'CLUB' | 'EVENT' }): Promise<string | null> => {
  const data = await exploreDetailService({ 
    id, 
    query: { type } as any, 
    userId: undefined 
  });

  if (!data) return null;
  const typedData = data as any;
  const name = String(typedData.name || typedData.eventName || 'BookDiaNight');
  const description = String(typedData.description || 'Join us on BookDiaNight!');
  const location = String(typedData.location || 'Dhaka, Bangladesh');
  const thumbnail = String(typedData.thumbnail || typedData.coverImage || '');
  const typeLabel = type === 'CLUB' ? 'Club' : 'Event';
  
  const shareUrl = `https://bookdianight.localbox.online/explore/${type.toLowerCase()}/${id}`;
  const appSchemeUrl = `bookdianight://${type.toLowerCase()}/${id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
 
  <title>${name} | BookDiaNight</title>
 
  <meta property="og:site_name" content="BookDiaNight" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${name}" />
  <meta property="og:description" content="${description} · ${location}" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:image" content="${thumbnail}" />
  <meta property="og:image:alt" content="${name}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
 
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${name}" />
  <meta name="twitter:description" content="${description} · ${location}" />
  <meta name="twitter:image" content="${thumbnail}" />
 
  <meta name="theme-color" content="#0D0D0D" />
  <meta name="description" content="${description} · ${location}" />
 
  <style>
    :root {
      --bg: #070707;
      --card: #121212;
      --line: rgba(255, 255, 255, 0.08);
      --text: #ffffff;
      --muted: #9a9a9a;
      --gold: #e1b144;
      --gold-soft: rgba(225, 177, 68, 0.14);
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0; min-height: 100%; background: var(--bg); color: var(--text);
      font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    body {
      min-height: 100dvh; display: flex; align-items: center; justify-content: center;
      padding: 24px 16px 40px;
      background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(225, 177, 68, 0.18), transparent 55%), var(--bg);
    }
    .shell { width: 100%; max-width: 420px; }
    .brand {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 18px; color: var(--gold); font-size: 13px; font-weight: 700;
      letter-spacing: 0.08em; text-transform: uppercase;
    }
    .brand-dot {
      width: 7px; height: 7px; border-radius: 50%; background: var(--gold);
      box-shadow: 0 0 12px rgba(225, 177, 68, 0.8);
    }
    .card {
      background: linear-gradient(180deg, #161616 0%, #101010 100%);
      border: 1px solid var(--line); border-radius: 24px; overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
    }
    .cover-wrap {
      position: relative; aspect-ratio: 4 / 5; background: #1a1a1a; overflow: hidden;
    }
    .cover-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cover-fade {
      position: absolute; inset: auto 0 0 0; height: 42%;
      background: linear-gradient(to top, #101010 8%, transparent); pointer-events: none;
    }
    .badge-row { position: absolute; top: 14px; left: 14px; display: flex; flex-wrap: wrap; gap: 8px; z-index: 1; }
    .badge {
      padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 700;
      letter-spacing: 0.02em; background: rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.16); backdrop-filter: blur(8px);
    }
    .content { padding: 18px 18px 20px; }
    h1 { margin: 0 0 8px; font-size: 26px; line-height: 1.15; font-weight: 800; letter-spacing: -0.02em; }
    .meta { display: flex; align-items: flex-start; gap: 8px; color: var(--muted); font-size: 13px; line-height: 1.45; margin: 0 0 14px; }
    .meta svg { flex: 0 0 auto; margin-top: 2px; opacity: 0.85; }
    .desc {
      margin: 0 0 18px; color: #cfcfcf; font-size: 14px; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .actions { display: grid; gap: 10px; }
    .btn {
      display: flex; align-items: center; justify-content: center; min-height: 52px;
      border-radius: 14px; text-decoration: none; font-size: 15px; font-weight: 800;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    .btn:active { transform: scale(0.98); }
    .btn-primary { background: var(--gold); color: #111; box-shadow: 0 10px 28px rgba(225, 177, 68, 0.28); }
    .footnote { margin-top: 14px; text-align: center; color: #6f6f6f; font-size: 12px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="shell">
    <div class="brand">
      <span class="brand-dot"></span>
      BookDiaNight
    </div>
 
    <article class="card">
      <div class="cover-wrap">
        <div class="badge-row">
          <span class="badge">${typeLabel}</span>
        </div>
        <img src="${thumbnail}" alt="${name}" />
        <div class="cover-fade"></div>
      </div>
 
      <div class="content">
        <h1>${name}</h1>
 
        <p class="meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" stroke="currentColor" stroke-width="1.8"/>
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.8"/>
          </svg>
          <span>${location}</span>
        </p>
 
        <p class="desc">${description}</p>
 
        <div class="actions">
          <a class="btn btn-primary" href="${appSchemeUrl}">Open in BookDiaNight</a>
        </div>
      </div>
    </article>
 
    <p class="footnote">
      Opens the ${typeLabel.toLowerCase()} details in the BookDiaNight app.
    </p>
  </div>
 
  <script>
    (function () {
      var appUrl = "${appSchemeUrl}";
      if (!appUrl) return;
      var timer = setTimeout(function () {}, 1200);
      window.location.href = appUrl;
      clearTimeout(timer);
    })();
  </script>
</body>
</html>`;
};
