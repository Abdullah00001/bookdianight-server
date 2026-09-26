import {
  TRetrieveLoggedInUserBookingsQuery,
  TRetrieveLoggedInUserSingleBookingsQuery,
} from '@/app/modules/bookings/bookings.schema';
import { exploreDetailService } from '@/app/modules/explore/explore.services';

export interface IRetrieveLoggedInUserBookingsService {
  query: TRetrieveLoggedInUserBookingsQuery;
  userId: string;
}

export interface IRetrieveLoggedInUserSingleBookingsService {
  id: string;
  query: TRetrieveLoggedInUserSingleBookingsQuery;
  userId: string;
}

export interface IBookingPaginationMeta {
  total: number;
  totalPages: number;
  links: {
    currentPage: string;
    nextPage: string | null;
    previousPage: string | null;
    firstPage: string;
    lastPage: string;
  };
}

export type TExploreData = NonNullable<Awaited<ReturnType<typeof exploreDetailService>>>;
export type TExplorePresentation = Omit<TExploreData, 'id' | 'type'>;

export interface IBookingDetailResponse {
  id: string;
  clubId?: string;
  eventId?: string;
  type: 'CLUB' | 'EVENT';
  booking: {
    serviceType: 'CLUB' | 'EVENT';
    purchaseDate: Date;
    status: 'UPCOMING' | 'COMPLETED' | 'CANCELED';
    clubBooking?: {
      startAt: Date;
      endAt: Date;
      guestCount: number;
      clubName: string;
      clubLocation: string;
      packageName: string | null;
      packageCapacity: number | null;
    };
    eventPurchase?: {
      eventName: string;
      eventLocation: string;
      personCount: number;
      pricePerPerson: number;
      eventStartAt: Date;
      eventEndAt: Date;
      attendees: Array<{
        id: string;
        name: string;
        gender: string;
        age: string;
        phoneNumber: string;
      }>;
    };
    payment: {
      status: string;
      grossAmount: number;
      serviceChargeAmount: number;
      buyerTotal: number;
      currency: string;
    };
    ticketState: 'NOT_AVAILABLE' | 'PROCESSING' | 'READY' | 'FAILED';
    reviewState: 'NOT_ELIGIBLE' | 'CAN_REVIEW' | 'ALREADY_REVIEWED';
    refund: { status: string; amount: number; scheduledFor: Date | null } | null;
  };
}

export interface IRetrieveLoggedInUserTicketService {
  id: string;
}
