// Types specific to the notification queue can be defined here
// export interface INotificationJobData { ... }

import { NotificationType } from '@prisma/client';

export interface ISendFcmNotification {
  userIds: string[];
  notificationType: NotificationType;
  title: string;
  description?: string;
  metaData?: Record<string, any>;
}
