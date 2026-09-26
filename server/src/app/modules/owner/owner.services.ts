import prisma from '@/app/configs/db.configs';
import { IGetOwnerDashboardService, IOwnerDashboardResult } from '@/app/modules/owner/owner.types';
import { Prisma } from '@prisma/client';
import { currentFixedCstWallClock, decimalNumber } from '@/app/modules/purchase/purchase.helpers';
import { ILightweightExploreItem } from '@/app/modules/explore/explore.types';

export const getOwnerDashboardService = async ({
  userId,
}: IGetOwnerDashboardService): Promise<IOwnerDashboardResult> => {
  const activeOwnerOrdersWhere: Prisma.OrderWhereInput = {
    sellerUserId: userId,
    status: 'PAID',
    refund: null,
    OR: [
      { clubBooking: { club: { deactivatedAt: null } } },
      { eventPurchase: { event: { deactivatedAt: null, eventStatus: { not: 'CANCELED' } } } }
    ],
  };

  // 1. Total Club Bookings
  const totalClubBookings = await prisma.order.count({
    where: {
      ...activeOwnerOrdersWhere,
      serviceType: 'CLUB',
    },
  });

  // 2. Total Event Tickets Sold
  const totalEventTicketsSold = await prisma.eventPurchaseAttendee.count({
    where: {
      eventPurchase: {
        order: {
          ...activeOwnerOrdersWhere,
          serviceType: 'EVENT',
        },
      },
    },
  });

  // 3. Total Earnings
  const totalEarningsAgg = await prisma.order.aggregate({
    where: activeOwnerOrdersWhere,
    _sum: { sellerEarnings: true },
  });
  const totalEarnings = decimalNumber(totalEarningsAgg._sum.sellerEarnings || new Prisma.Decimal(0));

  // 4. This Month Earnings
  const now = currentFixedCstWallClock();
  const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 6, 0, 0, 0));

  const thisMonthEarningsAgg = await prisma.order.aggregate({
    where: {
      ...activeOwnerOrdersWhere,
      createdAt: { gte: firstDayOfMonth },
    },
    _sum: { sellerEarnings: true },
  });
  const thisMonthEarnings = decimalNumber(thisMonthEarningsAgg._sum.sellerEarnings || new Prisma.Decimal(0));

  // 5. Recent Bookings (Latest 2)
  const recentOrders = await prisma.order.findMany({
    where: activeOwnerOrdersWhere,
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: {
      clubBooking: {
        include: {
          club: {
            include: {
              clubPackages: true,
              reviews: true,
            },
          },
        },
      },
      eventPurchase: {
        include: {
          event: true,
        },
      },
    },
  });

  const recentBookings: ILightweightExploreItem[] = recentOrders.map((order) => {
    if (order.serviceType === 'CLUB' && order.clubBooking && order.clubBooking.club) {
      const { clubBooking } = order;
      const { club } = clubBooking;

      const prices = club.clubPackages.map((p) => Number(p.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      const reviewAvg =
        club.reviews.length > 0
          ? club.reviews.reduce((acc, curr) => acc + curr.rating, 0) / club.reviews.length
          : 0;

      return {
        id: clubBooking.id,
        name: club.name,
        lat: Number(club.lat),
        lng: Number(club.lng),
        location: club.location,
        type: 'CLUB',
        thumbnail: club.thumbnail,
        currency: order.currency,
        review: Number(reviewAvg.toFixed(1)),
        isVip: Boolean(club.isVip),
        priceRange: { minPrice, maxPrice },
      };
    } else if (order.serviceType === 'EVENT' && order.eventPurchase && order.eventPurchase.event) {
      const { eventPurchase } = order;
      const { event } = eventPurchase;

      return {
        id: eventPurchase.id,
        name: event.eventName,
        lat: Number(event.lat),
        lng: Number(event.lng),
        location: event.location,
        type: 'EVENT',
        thumbnail: event.thumbnail,
        currency: order.currency,
        price: Number(event.eventPrice),
      };
    }
    throw new Error('Incomplete order payload encountered');
  });

  return {
    totalClubBookings,
    totalEventTicketsSold,
    totalEarnings,
    thisMonthEarnings,
    recentBookings,
  };
};

export const getOwnerEarningsService = async ({
  userId,
  year,
}: import('@/app/modules/owner/owner.types').IGetOwnerEarningsService): Promise<import('@/app/modules/owner/owner.types').IOwnerEarningsResult> => {
  const activeOwnerOrdersWhere: Prisma.OrderWhereInput = {
    sellerUserId: userId,
    status: 'PAID',
    refund: null,
    OR: [
      { clubBooking: { club: { deactivatedAt: null } } },
      { eventPurchase: { event: { deactivatedAt: null, eventStatus: { not: 'CANCELED' } } } },
    ],
  };

  const now = currentFixedCstWallClock();
  const cstYear = now.getUTCFullYear();
  const cstMonth = now.getUTCMonth();
  const cstDate = now.getUTCDate();

  // 1. Time Boundaries
  const todayStart = new Date(Date.UTC(cstYear, cstMonth, cstDate, 6, 0, 0, 0));
  const tomorrowStart = new Date(Date.UTC(cstYear, cstMonth, cstDate + 1, 6, 0, 0, 0));
  const sevenDaysAgoStart = new Date(Date.UTC(cstYear, cstMonth, cstDate - 6, 6, 0, 0, 0));

  const selectedYear = year ?? cstYear;
  const selectedYearStart = new Date(Date.UTC(selectedYear, 0, 1, 6, 0, 0, 0));
  const nextYearStart = new Date(Date.UTC(selectedYear + 1, 0, 1, 6, 0, 0, 0));

  // 2. Today Overview
  const last7DaysRevenueAgg = await prisma.order.aggregate({
    where: { ...activeOwnerOrdersWhere, createdAt: { gte: sevenDaysAgoStart, lt: tomorrowStart } },
    _sum: { sellerEarnings: true },
  });
  const last7DaysRevenue = decimalNumber(last7DaysRevenueAgg._sum.sellerEarnings || new Prisma.Decimal(0));

  const todayRevenueAgg = await prisma.order.aggregate({
    where: { ...activeOwnerOrdersWhere, createdAt: { gte: todayStart, lt: tomorrowStart } },
    _sum: { sellerEarnings: true },
  });
  const todayRevenue = decimalNumber(todayRevenueAgg._sum.sellerEarnings || new Prisma.Decimal(0));

  const todayTotalClubBookings = await prisma.order.count({
    where: { ...activeOwnerOrdersWhere, serviceType: 'CLUB', createdAt: { gte: todayStart, lt: tomorrowStart } },
  });

  const todayTotalEventTicketsSold = await prisma.eventPurchaseAttendee.count({
    where: {
      eventPurchase: {
        order: { ...activeOwnerOrdersWhere, serviceType: 'EVENT', createdAt: { gte: todayStart, lt: tomorrowStart } },
      },
    },
  });

  // 3. Monthly Earning
  const ordersThisYear = await prisma.order.findMany({
    where: { ...activeOwnerOrdersWhere, createdAt: { gte: selectedYearStart, lt: nextYearStart } },
    select: { createdAt: true, sellerEarnings: true },
  });

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, amount: 0 }));
  for (const order of ordersThisYear) {
    const fixedCstDate = new Date(order.createdAt.getTime() - 21600000);
    const monthIndex = fixedCstDate.getUTCMonth();
    monthlyData[monthIndex].amount += Number(order.sellerEarnings);
  }
  monthlyData.forEach((m) => {
    m.amount = Number(m.amount.toFixed(2));
  });

  // 4. Available Years
  const bounds = await prisma.order.aggregate({
    where: activeOwnerOrdersWhere,
    _min: { createdAt: true },
    _max: { createdAt: true },
  });

  const availableYears: number[] = [];
  if (bounds._min.createdAt && bounds._max.createdAt) {
    const minYear = new Date(bounds._min.createdAt.getTime() - 21600000).getUTCFullYear();
    const maxYear = new Date(bounds._max.createdAt.getTime() - 21600000).getUTCFullYear();
    
    const yearPromises = [];
    for (let y = maxYear; y >= minYear; y--) {
      const yearStart = new Date(Date.UTC(y, 0, 1, 6, 0, 0, 0));
      const nextYearBoundary = new Date(Date.UTC(y + 1, 0, 1, 6, 0, 0, 0));

      yearPromises.push(
        prisma.order.findFirst({
          where: {
            ...activeOwnerOrdersWhere,
            createdAt: { gte: yearStart, lt: nextYearBoundary },
          },
          select: { id: true },
        }).then((order) => ({ year: y, hasData: !!order }))
      );
    }

    const yearResults = await Promise.all(yearPromises);
    for (const res of yearResults) {
      if (res.hasData) {
        availableYears.push(res.year);
      }
    }
  }

  return {
    todayOverview: {
      last7DaysRevenue,
      todayRevenue,
      todayTotalClubBookings,
      todayTotalEventTicketsSold,
    },
    monthlyEarning: {
      selectedYear,
      data: monthlyData,
      availableYears,
    },
  };
};

export const getOwnerPaymentsService = async ({
  userId,
  query,
}: import('@/app/modules/owner/owner.types').IGetOwnerPaymentsService): Promise<import('@/app/modules/owner/owner.types').IOwnerPaymentsResult> => {
  const { type, clubId, eventId, page = 1, limit = 10 } = query;

  const whereCondition: Prisma.OrderWhereInput = {
    sellerUserId: userId,
    status: 'PAID',
    refund: null,
  };

  const orConditions: Prisma.OrderWhereInput[] = [];

  if (!type || type === 'CLUB') {
    if (clubId) {
      orConditions.push({ clubBooking: { clubId } });
    } else {
      orConditions.push({ serviceType: 'CLUB' });
    }
  }

  if (!type || type === 'EVENT') {
    if (eventId) {
      orConditions.push({ eventPurchase: { eventId } });
    } else {
      orConditions.push({ serviceType: 'EVENT' });
    }
  }

  whereCondition.OR = orConditions;

  const total = await prisma.order.count({ where: whereCondition });
  const totalPages = Math.ceil(total / limit);

  const orders = await prisma.order.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      clubBooking: { select: { clubId: true, clubName: true } },
      eventPurchase: { select: { eventId: true, eventName: true } },
    },
  });

  const data: import('@/app/modules/owner/owner.types').TOwnerPaymentItem[] = orders.map((order) => {
    if (order.serviceType === 'CLUB' && order.clubBooking) {
      return {
        id: order.id,
        type: 'CLUB',
        clubId: order.clubBooking.clubId,
        title: order.clubBooking.clubName,
        customerName: order.buyerName,
        createdAt: order.createdAt,
        amount: Number(order.sellerEarnings),
      };
    } else if (order.serviceType === 'EVENT' && order.eventPurchase) {
      return {
        id: order.id,
        type: 'EVENT',
        eventId: order.eventPurchase.eventId,
        title: order.eventPurchase.eventName,
        customerName: order.buyerName,
        createdAt: order.createdAt,
        amount: Number(order.sellerEarnings),
      };
    }
    throw new Error(`Unexpected order state for order ${order.id}`);
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data,
  };
};