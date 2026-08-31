import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
  Application,
  Request,
  Response,
  json,
  urlencoded,
} from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import corsConfiguration from '@/app/configs/cors.configs';
import { getTraceId } from '@/app/configs/requestContext.configs';
import { traceMiddleware } from '@/app/middlewares/trace.middlewares';
import { baseUrl } from '@/const';
import { globalErrorMiddleware } from '@/app/middlewares/globalError.middlewares';
import { morganMessageFormat, streamConfig } from '@/app/configs/morgan.configs';
import v1Routes from '@/app/routes/v1';
import prisma from '@/app/configs/db.configs';
import { getRedisClient } from '@/app/configs/redis.configs';
const app: Application = express();

app.use(traceMiddleware);
app.use((req, res, next) => {
  if (req.originalUrl.includes('/webhooks/payment/stripe')) {
    next(); // skip json() — raw() in the route handles it
  } else {
    json()(req, res, next);
  }
});
app.use(urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use(cookieParser());
app.use(cors(corsConfiguration));
app.use(
  morgan(morganMessageFormat, {
    stream: {
      write: (message: string) => streamConfig(message),
    },
  })
);
app.use(helmet());

app.get('/health', async (_req: Request, res: Response) => {
  const traceId = getTraceId();
  const timeoutMs = 3000;

  const withTimeout = <T>(promise: Promise<T>, ms: number, label: string) => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms))
    ]);
  };

  const status = {
    database: 'down',
    redis: 'down',
  };

  let isHealthy = true;

  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, timeoutMs, 'Database');
    status.database = 'up';
  } catch (error) {
    console.error(`[HealthCheck] Database error:`, error);
    isHealthy = false;
  }

  try {
    const redisClient = getRedisClient();
    if (redisClient) {
      const pingResult = await withTimeout(redisClient.ping(), timeoutMs, 'Redis');
      if (pingResult === 'PONG') {
        status.redis = 'up';
      } else {
        console.error(`[HealthCheck] Redis returned unexpected ping result:`, pingResult);
        isHealthy = false;
      }
    } else {
      console.error(`[HealthCheck] Redis client not initialized`);
      isHealthy = false;
    }
  } catch (error) {
    console.error(`[HealthCheck] Redis error:`, error);
    isHealthy = false;
  }

  if (isHealthy) {
    res.status(200).json({
      status: 'ok',
      success: true,
      message: 'Server Is Running',
      dependencies: status,
      traceId,
    });
  } else {
    res.status(503).json({
      status: 'degraded',
      success: false,
      message: 'Service is degraded',
      dependencies: status,
      traceId,
    });
  }
  return;
});

/* ====================================|
|--------------APP ROUTES--------------|
|==================================== */

// V1 ROUTES
app.use(baseUrl.v1, v1Routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use(globalErrorMiddleware);

export default app;
