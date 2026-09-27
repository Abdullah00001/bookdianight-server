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
