import { ServiceCharge } from '@prisma/client';
import { TUpdateServiceChargePayload } from '@/app/modules/serviceCharge/serviceCharge.schema';

export interface IGetServiceChargeService {
  serviceCharge: ServiceCharge;
}

export interface IUpdateServiceChargeService {
  serviceCharge: ServiceCharge;
  payload: TUpdateServiceChargePayload;
}

export interface IServiceChargeResponse {
  id: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
