import { Request, Response } from 'express';
import { LegalContentType } from '@prisma/client';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import {
  getLegalContentService,
  updateLegalContentService,
} from '@/app/modules/legal/legal.services';
import { TUpdateLegalContentPayload } from '@/app/modules/legal/legal.schema';

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

export const getAdminTermsController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getLegalContentService({
      legalContentType: LegalContentType.TERMS_AND_CONDITION,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content retrieved successfully',
      data,
      traceId,
    });
  }
);

export const updateAdminTermsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const payload = req.body as TUpdateLegalContentPayload;
    const data = await updateLegalContentService({
      legalContentType: LegalContentType.TERMS_AND_CONDITION,
      payload,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content updated successfully',
      data,
      traceId,
    });
  }
);

export const getAdminPrivacyController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getLegalContentService({
      legalContentType: LegalContentType.PRIVACY_AND_POLICY,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content retrieved successfully',
      data,
      traceId,
    });
  }
);

export const updateAdminPrivacyController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const payload = req.body as TUpdateLegalContentPayload;
    const data = await updateLegalContentService({
      legalContentType: LegalContentType.PRIVACY_AND_POLICY,
      payload,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content updated successfully',
      data,
      traceId,
    });
  }
);

export const getAdminAboutUsController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getLegalContentService({
      legalContentType: LegalContentType.ABOUT_US,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content retrieved successfully',
      data,
      traceId,
    });
  }
);

export const updateAdminAboutUsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const payload = req.body as TUpdateLegalContentPayload;
    const data = await updateLegalContentService({
      legalContentType: LegalContentType.ABOUT_US,
      payload,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content updated successfully',
      data,
      traceId,
    });
  }
);

// ==========================================
// PUBLIC CONTROLLERS
// ==========================================

export const getTermsController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getLegalContentService({
      legalContentType: LegalContentType.TERMS_AND_CONDITION,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content retrieved successfully',
      data,
      traceId,
    });
  }
);

export const getPrivacyController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getLegalContentService({
      legalContentType: LegalContentType.PRIVACY_AND_POLICY,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content retrieved successfully',
      data,
      traceId,
    });
  }
);

export const getAboutUsController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const data = await getLegalContentService({
      legalContentType: LegalContentType.ABOUT_US,
    });

    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Legal content not found',
        traceId,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Legal content retrieved successfully',
      data,
      traceId,
    });
  }
);
