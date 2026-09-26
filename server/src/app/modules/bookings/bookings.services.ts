import prisma from '@/app/configs/db.configs';
import {
  IRetrieveLoggedInUserBookingsService,
  IRetrieveLoggedInUserSingleBookingsService,
  IBookingDetailResponse,
  TExploreData,
  TExplorePresentation,
} from '@/app/modules/bookings/bookings.types';
import { ILightweightExploreItem } from '@/app/modules/explore/explore.types';
import { exploreDetailService } from '@/app/modules/explore/explore.services';
import { Prisma } from '@prisma/client';
import { currentFixedCstWallClock } from '@/app/modules/purchase/purchase.helpers';

/**
 * This service is used to retrieve all bookings of logged in user
 * @returns Promise<{ data: ILightweightExploreItem[]; total: number; totalPages: number }>
 */
export const retrieveLoggedInUserBookingsService = async ({
  query,
  userId,
}: IRetrieveLoggedInUserBookingsService): Promise<{ data: ILightweightExploreItem[]; total: number; totalPages: number }> => {
  const { tab, page, limit } = query;
  const skip = (page - 1) * limit;
  const now = currentFixedCstWallClock();

  const baseWhere: Prisma.OrderWhereInput = {
    buyerUserId: userId,
    status: 'PAID',
    refund: tab === 'CANCELED' ? undefined : null,
  };

  const orConditions: Prisma.OrderWhereInput[] = [];

  if (tab === 'UPCOMING') {
    orConditions.push({
      serviceType: 'CLUB',
      clubBooking: { startAt: { gt: now } },
    });
    orConditions.push({
      serviceType: 'EVENT',
      eventPurchase: {
        eventStartAt: { gt: now },
        event: { eventStatus: { not: 'CANCELED' } },
      },
    });
  } else if (tab === 'COMPLETED') {
    orConditions.push({
      serviceType: 'CLUB',
      clubBooking: { endAt: { lte: now } },
    });
    orConditions.push({
      serviceType: 'EVENT',
      eventPurchase: {
        eventEndAt: { lte: now },
        event: { eventStatus: { not: 'CANCELED' } },
      },
    });
  } else if (tab === 'CANCELED') {
    orConditions.push({
      serviceType: 'EVENT',
      eventPurchase: {
        event: { eventStatus: 'CANCELED' },
      },
    });
  }

  const where: Prisma.OrderWhereInput = {
    ...baseWhere,
    OR: orConditions,
  };

  const total = await prisma.order.count({ where });

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
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

  const formattedData: ILightweightExploreItem[] = orders.map((order) => {
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
        id: clubBooking.id, // Booking id takes precedence as per requirements
        name: club.name,
        lat: Number(club.lat),
        lng: Number(club.lng),
        location: club.location,
        type: 'CLUB',
        thumbnail: club.thumbnail,
        currency: order.currency,

        review: Number(reviewAvg.toFixed(1)),
        isVip: Boolean(club.isVip),
        priceRange: {
          minPrice,
          maxPrice,
        },
      };
    } else if (order.serviceType === 'EVENT' && order.eventPurchase && order.eventPurchase.event) {
      const { eventPurchase } = order;
      const { event } = eventPurchase;

      return {
        id: eventPurchase.id, // Booking id takes precedence as per requirements
        name: event.eventName,
        lat: Number(event.lat),
        lng: Number(event.lng),
        location: event.location,
        type: 'EVENT',
        thumbnail: event.thumbnail,
        currency: order.currency,
        price: 0, // In Explore list, Event price is fetched via raw SQL minPrice alias, substituting 0 as placeholder.
      };
    }

    throw new Error('Invalid booking state or missing relation');
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: formattedData,
    total,
    totalPages,
  };
};

/**
 * This service is used to retrieve single booking of logged in user
 * @returns Promise<IBookingDetailResponse>
 */
export const retrieveLoggedInUserSingleBookingsService = async ({
  id,
  query,
  userId,
}: IRetrieveLoggedInUserSingleBookingsService): Promise<IBookingDetailResponse> => {
  const { type } = query;
  const now = currentFixedCstWallClock();

  if (type === 'CLUB') {
    const clubBooking = await prisma.clubBooking.findUniqueOrThrow({
      where: { id },
      include: {
        order: {
          include: {
            ticketPdf: true,
          },
        },
      },
    });

    const exploreData = await exploreDetailService({ id: clubBooking.clubId, query: { type }, userId });
    if (!exploreData) throw new Error('Explore data not found');
    
    // Explicitly destructure to omit conflicting identity fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _exploreId, type: _exploreType, ...explorePresentation } = exploreData as TExploreData & { id?: string; type?: string };

    let reviewState: 'NOT_ELIGIBLE' | 'CAN_REVIEW' | 'ALREADY_REVIEWED' = 'NOT_ELIGIBLE';
    if (clubBooking.order.status === 'PAID' && clubBooking.endAt <= now) {
      const existingReview = await prisma.clubReview.findFirst({
        where: { userId, clubId: clubBooking.clubId },
      });
      reviewState = existingReview ? 'ALREADY_REVIEWED' : 'CAN_REVIEW';
    }

    let ticketState: 'NOT_AVAILABLE' | 'PROCESSING' | 'READY' | 'FAILED' = 'NOT_AVAILABLE';
    if (clubBooking.order.ticketPdf) {
      if (clubBooking.order.ticketPdf.status === 'PENDING') ticketState = 'PROCESSING';
      else if (clubBooking.order.ticketPdf.status === 'GENERATED') ticketState = 'READY';
      else if (clubBooking.order.ticketPdf.status === 'FAILED') ticketState = 'FAILED';
    }

    let status: 'UPCOMING' | 'COMPLETED' | 'CANCELED' = 'UPCOMING';
    if (clubBooking.endAt <= now) {
      status = 'COMPLETED';
    }

    return {
      id: clubBooking.id,
      clubId: clubBooking.clubId,
      type: 'CLUB',
      ...(explorePresentation as TExplorePresentation),
      booking: {
        serviceType: 'CLUB',
        purchaseDate: clubBooking.order.createdAt,
        status,
        clubBooking: {
          startAt: clubBooking.startAt,
          endAt: clubBooking.endAt,
          guestCount: clubBooking.guestCount,
          clubName: clubBooking.clubName,
          clubLocation: clubBooking.clubLocation,
          packageName: clubBooking.packageName,
          packageCapacity: clubBooking.packageCapacity,
        },
        payment: {
          status: clubBooking.order.status,
          grossAmount: Number(clubBooking.order.grossAmount),
          serviceChargeAmount: Number(clubBooking.order.serviceChargeAmount),
          buyerTotal: Number(clubBooking.order.buyerTotal),
          currency: clubBooking.order.currency,
        },
        ticketState,
        reviewState,
        refund: null,
      },
    };
  } else {
    // EVENT
    const eventPurchase = await prisma.eventPurchase.findUniqueOrThrow({
      where: { id },
      include: {
        attendees: true,
        event: true,
        order: {
          include: {
            ticketPdf: true,
            refund: true,
          },
        },
      },
    });

    const exploreData = await exploreDetailService({ id: eventPurchase.eventId, query: { type }, userId });
    if (!exploreData) throw new Error('Explore data not found');

    // Explicitly destructure to omit conflicting identity fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _exploreId, type: _exploreType, ...explorePresentation } = exploreData as TExploreData & { id?: string; type?: string };

    let ticketState: 'NOT_AVAILABLE' | 'PROCESSING' | 'READY' | 'FAILED' = 'NOT_AVAILABLE';
    if (eventPurchase.order.ticketPdf) {
      if (eventPurchase.order.ticketPdf.status === 'PENDING') ticketState = 'PROCESSING';
      else if (eventPurchase.order.ticketPdf.status === 'GENERATED') ticketState = 'READY';
      else if (eventPurchase.order.ticketPdf.status === 'FAILED') ticketState = 'FAILED';
    }

    let status: 'UPCOMING' | 'COMPLETED' | 'CANCELED' = 'UPCOMING';
    if (eventPurchase.event.eventStatus === 'CANCELED') {
      status = 'CANCELED';
    } else if (eventPurchase.eventEndAt <= now) {
      status = 'COMPLETED';
    }

    let refundData = null;
    if (eventPurchase.event.eventStatus === 'CANCELED' && eventPurchase.order.refund) {
      refundData = {
        status: eventPurchase.order.refund.status,
        amount: Number(eventPurchase.order.grossAmount),
        scheduledFor: eventPurchase.order.refund.scheduledFor,
      };
    }

    return {
      id: eventPurchase.id,
      eventId: eventPurchase.eventId,
      type: 'EVENT',
      ...(explorePresentation as TExplorePresentation),
      booking: {
        serviceType: 'EVENT',
        purchaseDate: eventPurchase.order.createdAt,
        status,
        eventPurchase: {
          eventName: eventPurchase.eventName,
          eventLocation: eventPurchase.eventLocation,
          personCount: eventPurchase.personCount,
          pricePerPerson: Number(eventPurchase.pricePerPerson),
          eventStartAt: eventPurchase.eventStartAt,
          eventEndAt: eventPurchase.eventEndAt,
          attendees: eventPurchase.attendees.map((a) => ({
            id: a.id,
            name: a.name,
            gender: a.gender || '',
            age: a.age ? String(a.age) : '',
            phoneNumber: a.phoneNumber,
          })),
        },
        payment: {
          status: eventPurchase.order.status,
          grossAmount: Number(eventPurchase.order.grossAmount),
          serviceChargeAmount: Number(eventPurchase.order.serviceChargeAmount),
          buyerTotal: Number(eventPurchase.order.buyerTotal),
          currency: eventPurchase.order.currency,
        },
        ticketState,
        reviewState: 'NOT_ELIGIBLE',
        refund: refundData,
      },
    };
  }
};
