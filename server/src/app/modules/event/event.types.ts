import { TCreateEventPayload, TUpdateEventPayload } from './event.schema';

export interface ICreateEventService {
  userId: string;
  payload: TCreateEventPayload;
}

export interface IUpdateEventService {
  eventId: string;
  userId: string;
  payload: TUpdateEventPayload;
}
