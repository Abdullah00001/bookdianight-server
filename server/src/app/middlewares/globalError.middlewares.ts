import { NextFunction, Request, Response } from 'express';

import logger from '@/app/configs/logger.configs';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { ExtendedError } from '@/app/@types/error.types';

export const globalErrorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const traceId = getTraceId();
  if (err instanceof Error) {
    const e = err as ExtendedError;
    const causeObj = e.cause;
    const causeStr = causeObj ? ` | Cause: [${causeObj.name}] ${causeObj.message} (Code: ${causeObj.code})` : '';
    const metaStr = e.$metadata ? ` | $metadata: ${JSON.stringify(e.$metadata)}` : '';

    logger.error({
      traceId: traceId,
      message: `${err.name}: ${err.message}${causeStr}${metaStr}`,
      stack: err.stack,
    });

    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      traceId: traceId,
    });
    return;
  }

  logger.error({
    traceId,
    message: 'Unexpected Error Occurred In Somewhere',
  });

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    traceId,
  });

  return;
};
