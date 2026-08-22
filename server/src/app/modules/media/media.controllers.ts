import { Request, Response } from 'express';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { asyncHandler } from '@/app/utils/system.utils';
import { uploadMediaService } from '@/app/modules/media/media.services';

export const uploadMediaController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const traceId = getTraceId();
    const files = req.files as Express.Multer.File[];
    const data = await uploadMediaService({ files });
    res.status(200).json({
      success: true,
      message: 'Media uploads successful',
      data,
      traceId,
    });
    return;
  }
);
