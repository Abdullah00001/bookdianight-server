import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  getServiceChargeService,
  updateServiceChargeService,
} from '@/app/modules/serviceCharge/serviceCharge.services';
import { TUpdateServiceChargePayload } from '@/app/modules/serviceCharge/serviceCharge.schema';

/**
 * Retrieves the global Service Charge configuration.
 *
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getServiceChargeController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getServiceChargeService({
      serviceCharge: req.serviceCharge,
    });

    res.status(200).json({
      success: true,
      message: 'Service Charge retrieved successfully',
      data,
      traceId,
    });
  }
);

/**
 * Updates the global Service Charge configuration.
 *
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const updateServiceChargeController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const payload: TUpdateServiceChargePayload = req.body;
    const data = await updateServiceChargeService({
      serviceCharge: req.serviceCharge,
      payload,
    });

    res.status(200).json({
      success: true,
      message: 'Service Charge updated successfully',
      data,
      traceId,
    });
  }
);
