import prisma from '@/app/configs/db.configs';
import { getRedisClient } from '@/app/configs/redis.configs';
import { createRedisKey, expiresInTimeUnitToMs } from '@/app/utils/system.utils';
import {
  generateAccessTokenForAdmin,
  generateRefreshToken,
} from '@/app/utils/jwt.utils';
import { hashToken } from '@/app/utils/crypto.utils';
import { AuthErrorType, REDIS_PREFIXES, refreshTokenExpiresInWithRememberMe } from '@/const';
import {
  ILoginAdminService,
  ICheckAdminService,
  IRefreshAdminService,
  ILogoutAdminService,
  IGetAdminProfileService,
  IUpdateAdminProfileService,
  IChangeAdminPasswordService,
  IUpdateCommissionService,
} from '@/app/modules/admin/admin.types';
import crypto from 'crypto';
import { ITokenPayload } from '@/app/@types/jwt.types';
import { ApplicationCharge, Prisma, AccountStatus } from '@prisma/client';

const serializeCommission = (charge: ApplicationCharge) => ({
  ...charge,
  chargePercentage: Number(charge.chargePercentage),
});

/**
 * Service for admin login.
 * Operates on a trusted context established by middleware.
 * Generates tokens and sets up the Redis session.
 * 
 * @param {ILoginAdminService} param0
 * @returns {Promise<Record<string, unknown>>}
 */
export const loginAdminService = async ({
  user,
}: ILoginAdminService): Promise<Record<string, unknown>> => {
  const redisClient = getRedisClient();
  try {
    const tokenPayload: ITokenPayload = {
      sub: user.id,
      role: user.accountRole,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      rememberMe: true, // Always issue a longer-lived refresh token for admin
    };

    const accessToken = generateAccessTokenForAdmin(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const csrfToken = crypto.randomBytes(32).toString('hex');

    // Hash the raw refresh token for Redis storage
    const hashedRefreshToken = hashToken(refreshToken);
    
    // Calculate TTL for Redis key based on refresh token expiration
    // Use Math.floor to ensure an integer of seconds for Redis EX
    const refreshTokenTTL = Math.floor(expiresInTimeUnitToMs(refreshTokenExpiresInWithRememberMe) / 1000);
    
    const sessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, hashedRefreshToken);
    await redisClient.set(sessionKey, '1', 'EX', refreshTokenTTL);

    const { password: _password, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      csrfToken,
      user: userWithoutPassword,
    };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for checking admin authentication status.
 * Relies on the trusted context provided by middleware.
 * 
 * @param {ICheckAdminService} param0
 * @returns {Promise<Record<string, unknown>>}
 */
export const checkAdminService = async ({
  user,
}: ICheckAdminService): Promise<Record<string, unknown>> => {
  try {
    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
    };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for refreshing admin tokens.
 * Atomically consumes the old refresh token in Redis to prevent reuse.
 * 
 * @param {IRefreshAdminService} param0
 * @returns {Promise<Record<string, unknown>>}
 */
export const refreshAdminService = async ({
  user,
  refreshToken,
}: IRefreshAdminService): Promise<Record<string, unknown>> => {
  const redisClient = getRedisClient();
  try {
    const hashedRefreshToken = hashToken(refreshToken);
    const sessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, hashedRefreshToken);

    // Atomic consumption of the refresh token session
    const deletedCount = await redisClient.del(sessionKey);
    
    if (deletedCount === 0) {
      throw {
        status: 401,
        message: 'Refresh token is invalid or already consumed',
        errorType: AuthErrorType.TOKEN_INVALID,
      };
    }

    const tokenPayload: ITokenPayload = {
      sub: user.id,
      role: user.accountRole,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      rememberMe: true,
    };

    const newAccessToken = generateAccessTokenForAdmin(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);
    const newCsrfToken = crypto.randomBytes(32).toString('hex');

    const newHashedRefreshToken = hashToken(newRefreshToken);
    const refreshTokenTTL = Math.floor(expiresInTimeUnitToMs(refreshTokenExpiresInWithRememberMe) / 1000);
    
    const newSessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, newHashedRefreshToken);
    await redisClient.set(newSessionKey, '1', 'EX', refreshTokenTTL);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      csrfToken: newCsrfToken,
    };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for admin logout.
 * Blacklists the current access token and removes the specific refresh session.
 * 
 * @param {ILogoutAdminService} param0
 * @returns {Promise<void>}
 */
export const logoutAdminService = async ({
  user,
  accessToken,
  refreshToken,
}: ILogoutAdminService): Promise<void> => {
  const redisClient = getRedisClient();
  try {
    if (refreshToken) {
      const hashedRefreshToken = hashToken(refreshToken);
      const sessionKey = createRedisKey(REDIS_PREFIXES.adminSession, user.id, hashedRefreshToken);
      await redisClient.del(sessionKey);
    }

    if (accessToken) {
      // 15 minutes TTL for access token blacklist
      const accessTokenTTL = 15 * 60;
      const blacklistKey = createRedisKey(REDIS_PREFIXES.blacklist, accessToken);
      await redisClient.set(blacklistKey, '1', 'EX', accessTokenTTL);
    }
  } catch (error: any) {
    throw error;
  }
};

/**
 * Service for fetching admin profile.
 * Retrieves the admin's core data and nested profile fields.
 * Returns the sanitized admin record.
 * @returns Promise<Record<string, unknown>>
 */
export const getAdminProfileService = async ({
  userId,
}: IGetAdminProfileService): Promise<Record<string, unknown>> => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { profile: true },
    });

    const { password: _password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Service for updating admin profile.
 * Modifies the admin's core fields and nested profile fields atomically via a transaction.
 * Returns the updated sanitized admin record.
 * @returns Promise<Record<string, unknown>>
 */
export const updateAdminProfileService = async ({
  userId,
  payload,
}: IUpdateAdminProfileService): Promise<Record<string, unknown>> => {
  try {
    const { name, phoneNumber, profileAvatar } = payload;

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update User if User fields are provided
      if (name !== undefined || phoneNumber !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(name !== undefined && { name }),
            ...(phoneNumber !== undefined && { phoneNumber }),
          },
        });
      }

      // 2. Update Profile if Profile fields are provided
      if (profileAvatar !== undefined) {
        await tx.profile.update({
          where: { userId },
          data: {
            profileAvatar,
          },
        });
      }

      // 3. Fetch and return the combined result
      return await tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: { profile: true },
      });
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return {
      user: userWithoutPassword,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Service for changing admin password.
 * Hashes the new password and updates the user record.
 * @returns Promise<void>
 */
export const changeAdminPasswordService = async ({
  userId,
  payload,
}: IChangeAdminPasswordService): Promise<void> => {
  try {
    const { newPassword } = payload;
    const { hashPassword } = await import('@/app/utils/password.utils');
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Service for updating commission configuration.
 * Updates the ApplicationCharge for a specific serviceType.
 * Returns the updated record.
 * @returns Promise<Record<string, unknown>>
 */
export const updateCommissionService = async ({
  payload,
}: IUpdateCommissionService): Promise<Record<string, unknown>> => {
  try {
    const { serviceType, chargePercentage } = payload;

    // Use findFirst to check existence
    const existing = await prisma.applicationCharge.findFirst({
      where: { serviceType },
    });

    if (!existing) {
      return { error: 'Commission configuration not found for this service type' };
    }

    const updatedCharge = await prisma.applicationCharge.update({
      where: { id: existing.id },
      data: { chargePercentage },
    });

    return {
      commission: serializeCommission(updatedCharge),
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Service for retrieving commission configurations.
 * Retrieves both EVENT and CLUB configurations.
 * @returns Promise<Record<string, unknown>>
 */
export const getCommissionService = async (): Promise<Record<string, unknown>> => {
  try {
    const { Service } = await import('@prisma/client');
    const charges = await prisma.applicationCharge.findMany({
      where: {
        serviceType: {
          in: [Service.EVENT, Service.CLUB],
        },
      },
    });

    const eventCharge = charges.find((charge) => charge.serviceType === Service.EVENT);
    const clubCharge = charges.find((charge) => charge.serviceType === Service.CLUB);

    if (!eventCharge || !clubCharge) {
      return {
        error: 'Incomplete commission configuration',
      };
    }

    return {
      commission: {
        EVENT: serializeCommission(eventCharge),
        CLUB: serializeCommission(clubCharge),
      },
    };
  } catch (error) {
    throw error;
  }
};

import { TGetDashboardQuery } from '@/app/modules/admin/admin.schema';

export const getAdminDashboardService = async ({
  query,
}: {
  query: TGetDashboardQuery;
}) => {
  try {
    const currentYear = new Date().getFullYear();
    const queryYear = query.year ? parseInt(query.year, 10) : currentYear;

    // 1. Calculate Total Users & Club Owners (Independent of query)
    const [totalUsers, totalClubOwners] = await Promise.all([
      prisma.user.count({ where: { accountRole: 'USER' } }),
      prisma.user.count({ where: { accountRole: 'CLUB_OWNER' } }),
    ]);

    // 2. Calculate Total Earnings (Independent of query)
    const paidOrders = await prisma.order.aggregate({
      where: { status: 'PAID' },
      _sum: {
        commissionAmount: true,
        serviceChargeAmount: true,
      },
    });

    const totalEarning =
      (Number(paidOrders._sum.commissionAmount) || 0) +
      (Number(paidOrders._sum.serviceChargeAmount) || 0);

    // 3. Available Years (Extract distinct years from User creation dates)
    // Prisma does not have DISTINCT YEAR easily, we'll fetch oldest user date
    const oldestUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });
    
    const oldestYear = oldestUser ? oldestUser.createdAt.getFullYear() : currentYear;
    const availableYears = [];
    for (let y = currentYear; y >= oldestYear; y--) {
      availableYears.push(y);
    }

    // 4. User Management Chart Data (Group by Month for the Given Year)
    const roleFilter = query.role ? query.role : { in: ['USER' as any, 'CLUB_OWNER' as any] };
    
    const usersThisYear = await prisma.user.findMany({
      where: {
        accountRole: roleFilter,
        createdAt: {
          gte: new Date(`${queryYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${queryYear}-12-31T23:59:59.999Z`),
        },
      },
      select: { createdAt: true },
    });

    // Initialize all 12 months with 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = Array.from({ length: 12 }, (_, i) => ({
      name: monthNames[i],
      users: 0,
    }));

    // Populate chart data
    usersThisYear.forEach((user) => {
      const monthIndex = user.createdAt.getMonth(); // 0 - 11
      chartData[monthIndex].users += 1;
    });

    return {
      availableYears,
      totalEarning,
      totalUsers,
      totalClubOwners,
      userManagementChart: chartData,
    };
  } catch (error) {
    throw error;
  }
};

import { TGetAdminUsersQuery, TAdminUserIdParams, TEarningsQuery } from '@/app/modules/admin/admin.schema';

export const getAdminUsersService = async ({ query }: { query: TGetAdminUsersQuery }) => {
  try {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      accountStatus: { not: 'DELETED' },
    };

    if (query.role) {
      whereCondition.accountRole = query.role;
    } else {
      whereCondition.accountRole = { in: ['USER', 'CLUB_OWNER'] };
    }

    if (query.search) {
      whereCondition.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          buyerOrders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              clubBooking: true,
              eventPurchase: true
            }
          },
          clubs: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              location: true,
              clubPackages: {
                take: 1,
                orderBy: { price: 'asc' },
                select: { price: true, currency: true }
              },
              reviews: {
                select: { rating: true }
              }
            }
          },
          events: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              eventName: true,
              location: true,
              eventPrice: true,
              currency: true,
            }
          },
          _count: {
            select: {
              buyerOrders: true,
              clubs: true,
              events: true,
            }
          }
        },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    const orderCounts = await prisma.order.groupBy({
      by: ['buyerUserId', 'serviceType'],
      where: { buyerUserId: { in: users.map(u => u.id) } },
      _count: { _all: true },
    });

    const mappedUsers = users.map(user => {
      const recentBookings = user.buyerOrders.map((order: any) => ({
        id: order.id,
        name: order.serviceType === 'EVENT' ? order.eventPurchase?.eventName : order.clubBooking?.clubName,
        status: order.status,
        amount: order.buyerTotal,
        date: order.createdAt
      }));

      const recentClubs = user.clubs.map(club => {
        const ratingSum = club.reviews.reduce((sum, review) => sum + Number(review.rating), 0);
        const avgRating = club.reviews.length > 0 ? (ratingSum / club.reviews.length).toFixed(1) : '0.0';
        return {
          id: club.id,
          name: club.name,
          location: club.location,
          rating: avgRating,
          price: club.clubPackages.length > 0 ? Number(club.clubPackages[0].price) : 0,
          currency: club.clubPackages.length > 0 ? club.clubPackages[0].currency : 'USD',
        };
      });

      const recentEvents = user.events.map(event => ({
        id: event.id,
        name: event.eventName,
        location: event.location,
        price: Number(event.eventPrice),
        currency: event.currency,
      }));

      const clubBookingsCount = orderCounts.find(oc => oc.buyerUserId === user.id && oc.serviceType === 'CLUB')?._count._all || 0;
      const eventBookingsCount = orderCounts.find(oc => oc.buyerUserId === user.id && oc.serviceType === 'EVENT')?._count._all || 0;

      const { _count, buyerOrders, clubs, events, ...restUser } = user;
      return {
        ...restUser,
        recentBookings,
        recentClubs,
        recentEvents,
        totalBookings: _count.buyerOrders,
        clubHostedCount: _count.clubs,
        eventHostedCount: _count.events,
        clubBookingsCount,
        eventBookingsCount
      };
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      users: mappedUsers,
    };
  } catch (error) {
    throw error;
  }
};

export const suspendAdminUserService = async ({ params }: { params: TAdminUserIdParams }) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      throw new Error('User not found');
    }

    const newStatus = user.accountStatus === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';

    await prisma.user.update({
      where: { id: params.id },
      data: { accountStatus: newStatus }
    });

    return { status: newStatus };
  } catch (error) {
    throw error;
  }
};

export const deleteAdminUserService = async ({ params }: { params: TAdminUserIdParams }) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      throw new Error('User not found');
    }

    const deletedEmail = `${user.email}_deleted_${Date.now()}`;

    await prisma.user.update({
      where: { id: params.id },
      data: { 
        accountStatus: AccountStatus.DELETED,
        email: deletedEmail
      }
    });

    return;
  } catch (error) {
    throw error;
  }
};

export const earningsForAdminService = async (query: TEarningsQuery) => {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '10', 10);
  const skip = (page - 1) * limit;

  // Filters
  const whereClause: Prisma.OrderWhereInput = {
    status: 'PAID' // Assuming only PAID orders count towards earnings
  };

  if (query.serviceType) {
    whereClause.serviceType = query.serviceType as any;
  }

  // 1. Total Earning
  const totalAgg = await prisma.order.aggregate({
    where: { status: 'PAID' },
    _sum: { commissionAmount: true },
  });
  const totalEarning = totalAgg._sum.commissionAmount || 0;

  // 2. Today Earning
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayAgg = await prisma.order.aggregate({
    where: {
      status: 'PAID',
      createdAt: { gte: startOfToday },
    },
    _sum: { commissionAmount: true },
  });
  const todayEarning = todayAgg._sum.commissionAmount || 0;

  // 3. Overview Table Data
  const [total, orders] = await Promise.all([
    prisma.order.count({ where: whereClause }),
    prisma.order.findMany({
      where: whereClause,
      include: {
        seller: true,
        clubBooking: true,
        eventPurchase: true,
        refund: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const data = orders.map((order) => {
    let name = '';
    let location = '';
    let dateAndTime: Date | null = null;

    if (order.serviceType === 'CLUB' && order.clubBooking) {
      name = order.clubBooking.clubName;
      location = order.clubBooking.clubLocation;
      dateAndTime = order.clubBooking.startAt;
    } else if (order.serviceType === 'EVENT' && order.eventPurchase) {
      name = order.eventPurchase.eventName;
      location = order.eventPurchase.eventLocation;
      dateAndTime = order.eventPurchase.eventStartAt;
    }

    return {
      id: order.id,
      name,
      createdBy: order.seller.name,
      dateAndTime,
      location,
      price: order.grossAmount,
      commission: order.commissionRate,
      earning: order.commissionAmount,
      status: order.refund ? 'Canceled' : (order.status === 'PAID' ? 'Completed' : 'Pending'),
      currency: order.currency,
      serviceType: order.serviceType,
    };
  });

  return {
    totalEarning,
    todayEarning,
    data,
    total,
    page,
    limit,
  };
};
