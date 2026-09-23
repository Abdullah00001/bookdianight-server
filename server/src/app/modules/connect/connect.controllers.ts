import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { env } from '@/env';
import {
  createOrResumeConnectOnboardingService,
  getConnectStatusService,
  processConnectWebhookService,
  refreshConnectOnboardingService,
} from '@/app/modules/connect/connect.services';

/**
 * Creates or resumes Stripe Connect onboarding for the trusted Club Owner.
 *
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const createOrResumeConnectOnboardingController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await createOrResumeConnectOnboardingService({
      user: req.user as User,
    });
    res.status(200).json({
      success: true,
      message: 'Connect onboarding status retrieved successfully',
      data,
      traceId,
    });
  }
);
/**
 * Retrieves the trusted Club Owner's sanitized Connect status.
 *
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const getConnectStatusController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getConnectStatusService({
      userId: (req.user as User).id,
    });
    res.status(200).json({
      success: true,
      message: 'Connect status retrieved successfully',
      data,
      traceId,
    });
  }
);
/**
 * Redirects a trusted callback request to a fresh Stripe onboarding link.
 *
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const refreshConnectOnboardingController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    res.redirect(
      303,
      await refreshConnectOnboardingService({
        userId: req.connectCallbackUserId!,
      })
    );
  }
);
/**
 * Refreshes authoritative Connect state before returning the browser flow to Flutter.
 *
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const returnFromConnectOnboardingController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await getConnectStatusService({
      userId: req.connectCallbackUserId,
    });
    res.redirect(303, env.FLUTTER_CONNECT_APP_LINK_URL);
  }
);
/**
 * Receives a signature-verified Stripe Connect webhook payload.
 *
 * @param req Request
 * @param res Response
 * @returns Promise<void>
 */
export const connectWebhookController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await processConnectWebhookService({
      payload: req.body,
      signature: req.header('stripe-signature'),
    });
    res.status(200).json({ received: true });
  }
);
