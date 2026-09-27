import {
  TClubAvailabilityQuery,
  TCreateClubPurchasePayload,
  TCreateEventPurchasePayload,
} from '@/app/modules/purchase/purchase.schema';
import { ClubBooking, EventPurchase, EventPurchaseAttendee, Order } from '@prisma/client';
export interface IClubAvailabilityService {
  query: TClubAvailabilityQuery;
}
export interface ICreateClubPurchaseService {
  userId: string;
  payload: TCreateClubPurchasePayload;
  idempotencyKey: string;
}
export interface ICreateEventPurchaseService {
  userId: string;
  payload: TCreateEventPurchasePayload;
  idempotencyKey: string;
  buyerAge: number;
}
export interface IClubPurchaseResult { order: Order; booking: ClubBooking; replayed: boolean; }
export interface IEventPurchaseResult { order: Order; eventPurchase: EventPurchase; attendees: EventPurchaseAttendee[]; replayed: boolean; }
