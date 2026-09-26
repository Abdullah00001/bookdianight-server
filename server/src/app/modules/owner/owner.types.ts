import { ILightweightExploreItem } from '@/app/modules/explore/explore.types';

export interface IGetOwnerDashboardService {
  userId: string;
}

export interface IOwnerDashboardResult {
  totalClubBookings: number;
  totalEventTicketsSold: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  recentBookings: ILightweightExploreItem[];
}