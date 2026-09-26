import { ILightweightExploreItem } from '@/app/modules/explore/explore.types';

export interface IGetOwnerDashboardService {
  userId: string;
}

export interface IGetOwnerEarningsService {
  userId: string;
  year?: number;
}

export interface IOwnerEarningsResult {
  todayOverview: {
    last7DaysRevenue: number;
    todayRevenue: number;
    todayTotalClubBookings: number;
    todayTotalEventTicketsSold: number;
  };
  monthlyEarning: {
    selectedYear: number;
    data: Array<{
      month: number;
      amount: number;
    }>;
    availableYears: number[];
  };
}

export type TOwnerPaymentsQuery = {
  type?: 'CLUB' | 'EVENT';
  clubId?: string;
  eventId?: string;
  page?: number;
  limit?: number;
};

export interface IGetOwnerPaymentsService {
  userId: string;
  query: TOwnerPaymentsQuery;
}

export type TOwnerPaymentItem =
  | {
      id: string;
      type: 'CLUB';
      clubId: string;
      title: string;
      customerName: string;
      createdAt: Date;
      amount: number;
    }
  | {
      id: string;
      type: 'EVENT';
      eventId: string;
      title: string;
      customerName: string;
      createdAt: Date;
      amount: number;
    };

export interface IOwnerPaymentsResult {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: TOwnerPaymentItem[];
}

export interface IOwnerDashboardResult {
  totalClubBookings: number;
  totalEventTicketsSold: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  recentBookings: ILightweightExploreItem[];
}