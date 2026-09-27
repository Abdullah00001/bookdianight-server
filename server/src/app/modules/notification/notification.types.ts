export interface IGetNotificationListParams {
  userId: string;
  page: number;
  limit: number;
}

export interface IReadNotificationParams {
  userId: string;
  notificationId: string;
}

export interface IReadAllNotificationsParams {
  userId: string;
}

export interface IGetUnreadCountParams {
  userId: string;
}

export interface INotificationPaginatedResponse<T> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: T;
}
