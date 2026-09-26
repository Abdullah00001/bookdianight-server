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