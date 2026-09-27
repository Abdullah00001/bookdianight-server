import {
  TCreateEventPayload,
  TUpdateEventPayload,
  TEventListQuery,
} from '@/app/modules/event/event.schema';

export interface ICreateEventService {
  userId: string;
  payload: TCreateEventPayload;
}

export interface IUpdateEventService {
  eventId: string;
  userId: string;
  payload: TUpdateEventPayload;
  trustedCancellationContext?: any;
}

export interface IGetEventListService {
  userId: string;
  query: TEventListQuery;
}

export interface IGetEventDetailService {
  eventId: string;
  userId: string;
}
