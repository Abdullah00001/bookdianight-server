import { Router, raw } from 'express';
import { paymentWebhookController } from '@/app/modules/webhook/webhook.controllers';

const router = Router();

router.post(
  '/webhooks/payment/stripe',
  raw({ type: 'application/json' }),
  paymentWebhookController
);

export default router;
