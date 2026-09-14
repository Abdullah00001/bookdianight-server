import prisma from '@/app/configs/db.configs';
import { ICreateClubService, IUpdateClubService, IGetClubListService, IGetClubDetailService } from '@/app/modules/club/club.types';
import { Club } from '@prisma/client';

/**
 * Service for creating a Club.
 * Executes a transaction to insert the Club, set its PostGIS geography,
 * and populate nested relations for opening hours and packages.
 * @returns Promise<Club>
 */
export const createClubService = async ({ userId, payload }: ICreateClubService): Promise<Club> => {
  const { openingHours, packages, ...clubData } = payload;

  if (packages && packages.length > 1) {
    const firstCurrency = packages[0].currency;
    const hasMixedCurrency = packages.some(pkg => pkg.currency !== firstCurrency);
    if (hasMixedCurrency) {
      throw { status: 422, message: 'All packages within a club must have the same currency' };
    }
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create the base Club record
    const club = await tx.club.create({
      data: {
        ...clubData,
        userId,
      },
    });

    // 2. Set the PostGIS geography point using raw SQL
    await tx.$executeRaw`
      UPDATE "Club" 
      SET geog = ST_SetSRID(ST_MakePoint(${clubData.lng}, ${clubData.lat}), 4326)::geography 
      WHERE id = ${club.id}
    `;

    // 3. Create Opening Hours
    if (openingHours && openingHours.length > 0) {
      const hoursData = openingHours.map((hour) => ({
        ...hour,
        clubId: club.id,
      }));
      await tx.clubOpeningHour.createMany({
        data: hoursData,
      });
    }

    // 4. Create Packages
    if (packages && packages.length > 0) {
      const packageData = packages.map((pkg) => ({
        ...pkg,
        clubId: club.id,
      }));
      await tx.clubPackage.createMany({
        data: packageData,
      });
    }

    return club;
  });
};

/**
 * Service for updating a Club.
 * Validates ownership, updates the Club, updates the PostGIS geography if location changed,
 * and recreates opening hours and packages within a transaction.
 * @returns Promise<Club>
 */
export const updateClubService = async ({ clubId, userId, payload }: IUpdateClubService): Promise<Club> => {
  const { openingHours, packages, ...clubData } = payload;

  if (packages && packages.length > 1) {
    const firstCurrency = packages[0].currency;
    const hasMixedCurrency = packages.some(pkg => pkg.currency !== firstCurrency);
    if (hasMixedCurrency) {
      throw { status: 422, message: 'All packages within a club must have the same currency' };
    }
  }

  // Verify ownership and existence
  await prisma.club.findUniqueOrThrow({
    where: { id: clubId, userId },
  });

  return await prisma.$transaction(async (tx) => {
    // 1. Update the base Club record
    const updatedClub = await tx.club.update({
      where: { id: clubId },
      data: clubData,
    });

    // 2. Update PostGIS geography point if lat/lng changed
    if (clubData.lat !== undefined && clubData.lng !== undefined) {
      await tx.$executeRaw`
        UPDATE "Club" 
        SET geog = ST_SetSRID(ST_MakePoint(${clubData.lng}, ${clubData.lat}), 4326)::geography 
        WHERE id = ${clubId}
      `;
    }

    // 3. Update Opening Hours in-place
    if (openingHours && openingHours.length > 0) {
      // Execute individual updates in parallel
      await Promise.all(
        openingHours.map(async (hour) => {
          const { id, ...hourData } = hour;
          await tx.clubOpeningHour.updateMany({
            where: { id, clubId },
            data: hourData,
          });
        })
      );
    }

    // 4. Update Packages in-place
    if (packages && packages.length > 0) {
      await Promise.all(
        packages.map(async (pkg) => {
          const { id, ...pkgData } = pkg;
          await tx.clubPackage.updateMany({
            where: { id, clubId },
            data: pkgData,
          });
        })
      );
    }

    return updatedClub;
  });
};

/**
 * Service for fetching a paginated list of Clubs belonging to an owner.
 * @returns Promise<{ data: Club[], total: number }>
 */
export const getClubListService = async ({ userId, query }: IGetClubListService) => {
  const { page, limit, isActive } = query;
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (isActive !== undefined) {
    where.deactivatedAt = isActive ? null : { not: null };
  }

  const [total, data] = await prisma.$transaction([
    prisma.club.count({ where }),
    prisma.club.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })
  ]);

  return { data, total };
};

/**
 * Service for fetching full details of a specific Club belonging to an owner.
 * @returns Promise<Club>
 */
export const getClubDetailService = async ({ clubId, userId }: IGetClubDetailService) => {
  return await prisma.club.findUniqueOrThrow({
    where: { id: clubId, userId },
    include: {
      clubOpeningHours: true,
      clubPackages: {
        orderBy: { sortOrder: 'asc' }
      }
    }
  });
};
