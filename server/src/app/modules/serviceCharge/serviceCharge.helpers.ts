import { ServiceCharge } from '@prisma/client';
import { IServiceChargeResponse } from '@/app/modules/serviceCharge/serviceCharge.types';

export const formatServiceCharge = (
  serviceCharge: ServiceCharge
): IServiceChargeResponse => ({
  ...serviceCharge,
  amount: Number(serviceCharge.amount),
});
