import prisma from '@/app/configs/db.configs';
import {
  IGetServiceChargeService,
  IServiceChargeResponse,
  IUpdateServiceChargeService,
} from '@/app/modules/serviceCharge/serviceCharge.types';
import { formatServiceCharge } from '@/app/modules/serviceCharge/serviceCharge.helpers';

/**
 * Retrieves the trusted global Service Charge configuration.
 *
 * @param param0 Service parameters
 * @returns Promise<IServiceChargeResponse>
 */
export const getServiceChargeService = async ({
  serviceCharge,
}: IGetServiceChargeService): Promise<IServiceChargeResponse> => {
  try {
    return formatServiceCharge(serviceCharge);
  } catch (error) {
    throw error;
  }
};

/**
 * Updates the trusted global Service Charge configuration.
 *
 * @param param0 Service parameters
 * @returns Promise<IServiceChargeResponse>
 */
export const updateServiceChargeService = async ({
  serviceCharge,
  payload,
}: IUpdateServiceChargeService): Promise<IServiceChargeResponse> => {
  try {
    const updatedServiceCharge = await prisma.serviceCharge.update({
      where: { id: serviceCharge.id },
      data: { amount: payload.amount },
    });

    return formatServiceCharge(updatedServiceCharge);
  } catch (error) {
    throw error;
  }
};
