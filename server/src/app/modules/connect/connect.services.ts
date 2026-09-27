import { Prisma, StripeConnectAccountStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import prisma from '@/app/configs/db.configs';
import { getRedisClient } from '@/app/configs/redis.configs';
import { stripe } from '@/app/configs/stripe.configs';
import { env } from '@/env';
import { REDIS_PREFIXES } from '@/const';
import { createRedisKey } from '@/app/utils/system.utils';
import {
  formatConnectStatus,
  getConnectUiState,
} from '@/app/modules/connect/connect.helpers';
import {
  IConnectStatusResponse,
  ICreateConnectAccountLinkService,
  ICreateOrResumeConnectOnboardingService,
  IGetConnectStatusService,
  IProcessConnectWebhookService,
  IRefreshConnectOnboardingService,
  IRetrieveConnectAccountService,
} from '@/app/modules/connect/connect.types';

const callbackTtl = 1800;
const statusFor = (state: IConnectStatusResponse['state']) =>
  state === 'READY'
    ? StripeConnectAccountStatus.ACTIVE
    : state === 'RESTRICTED'
      ? StripeConnectAccountStatus.RESTRICTED
      : StripeConnectAccountStatus.PENDING;

const retrieveAccount = async ({
  stripeAccountId,
}: IRetrieveConnectAccountService): Promise<Stripe.Account> => {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    if ('deleted' in account && account.deleted)
      throw new Error('Connected Stripe account is unavailable');
    return account;
  } catch (error) {
    throw error;
  }
};  

const syncConnectAccount = async ({
  connectAccountId,
  stripeAccount,
}: {
  connectAccountId: string;
  stripeAccount: Stripe.Account;
}): Promise<IConnectStatusResponse> => {
  try {
    const current = await prisma.stripeConnectAccount.findUniqueOrThrow({
      where: { id: connectAccountId },
    });
    const state = getConnectUiState(stripeAccount);
    const onboardingCompletedAt =
      current.onboardingCompletedAt ??
      (stripeAccount.details_submitted ? new Date() : null);
    await prisma.stripeConnectAccount.update({
      where: { id: connectAccountId },
      data: { status: statusFor(state), onboardingCompletedAt },
    });
    return formatConnectStatus({ state, onboardingCompletedAt });
  } catch (error) {
    throw error;
  }
};

/** Retrieves and synchronizes the authenticated owner's authoritative Connect status. */
export const getConnectStatusService = async ({
  userId,
}: IGetConnectStatusService): Promise<IConnectStatusResponse> => {
  try {
    const local = await prisma.stripeConnectAccount.findUnique({
      where: { userId },
    });
    if (!local)
      return formatConnectStatus({
        state: 'SETUP_REQUIRED',
        onboardingCompletedAt: null,
      });
    const stripeAccount = await retrieveAccount({
      stripeAccountId: local.stripeAccountId,
    });
    return syncConnectAccount({ connectAccountId: local.id, stripeAccount });
  } catch (error) {
    throw error;
  }
};

const createConnectAccountLinkService = async ({
  userId,
  stripeAccountId,
}: ICreateConnectAccountLinkService): Promise<string> => {
  try {
    const token = randomUUID();
    await getRedisClient().set(
      createRedisKey(REDIS_PREFIXES.connectOnboarding, token),
      userId,
      'EX',
      callbackTtl
    );
    const query = `?token=${encodeURIComponent(token)}`;
    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${env.STRIPE_CONNECT_PUBLIC_BASE_URL}/api/v1/connect/refresh${query}`,
      return_url: `${env.STRIPE_CONNECT_PUBLIC_BASE_URL}/api/v1/connect/return${query}`,
      type: 'account_onboarding',
    });
    return link.url;
  } catch (error) {
    throw error;
  }
};

/** Creates or reuses an Express account and returns a fresh onboarding URL when required. */
export const createOrResumeConnectOnboardingService = async ({
  user,
}: ICreateOrResumeConnectOnboardingService): Promise<{
  onboardingUrl: string | null;
  status: IConnectStatusResponse;
}> => {
  try {
    let local = await prisma.stripeConnectAccount.findUnique({
      where: { userId: user.id },
    });
    if (!local) {
      const account = await stripe.accounts.create(
        {
          country: 'IT',
          type: 'express',
          capabilities: { transfers: { requested: true } },
          metadata: { bookdianightUserId: user.id },
        },
        { idempotencyKey: `connect-account:${user.id}` }
      );
      try {
        local = await prisma.stripeConnectAccount.create({
          data: { userId: user.id, stripeAccountId: account.id },
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2002'
        )
          throw error;
        local = await prisma.stripeConnectAccount.findUniqueOrThrow({
          where: { userId: user.id },
        });
      }
    }
    const status = await getConnectStatusService({ userId: user.id });
    return {
      onboardingUrl:
        status.state === 'READY' || status.state === 'RESTRICTED'
          ? null
          : await createConnectAccountLinkService({
              userId: user.id,
              stripeAccountId: local.stripeAccountId,
            }),
      status,
    };
  } catch (error) {
    throw error;
  }
};

/** Creates a replacement single-use onboarding URL for a trusted callback owner. */
export const refreshConnectOnboardingService = async ({
  userId,
}: IRefreshConnectOnboardingService): Promise<string> => {
  try {
    const local = await prisma.stripeConnectAccount.findUniqueOrThrow({
      where: { userId },
    });
    return createConnectAccountLinkService({
      userId,
      stripeAccountId: local.stripeAccountId,
    });
  } catch (error) {
    throw error;
  }
};

/** Verifies, deduplicates, and synchronizes supported Stripe Connect webhook events. */
export const processConnectWebhookService = async ({
  payload,
  signature,
}: IProcessConnectWebhookService): Promise<void> => {
  try {
    if (!signature) throw new Error('Stripe signature is missing');
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_CONNECT_WEBHOOK_SECRET_KEY
    );
    if (
      !new Set([
        'account.updated',
        'account.external_account.updated',
        'capability.updated',
      ]).has(event.type)
    )
      return;
    const prior = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (prior?.status === 'PROCESSED') return;
    const record =
      prior ??
      (await prisma.webhookEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          payload: JSON.stringify(event),
        },
      }));
    try {
      const local = event.account
        ? await prisma.stripeConnectAccount.findUnique({
            where: { stripeAccountId: event.account },
          })
        : null;
      if (local)
        await syncConnectAccount({
          connectAccountId: local.id,
          stripeAccount: await retrieveAccount({
            stripeAccountId: local.stripeAccountId,
          }),
        });
      await prisma.webhookEvent.update({
        where: { id: record.id },
        data: { status: 'PROCESSED', processedAt: new Date() },
      });
    } catch (error) {
      await prisma.webhookEvent.update({
        where: { id: record.id },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  } catch (error) {
    throw error;
  }
};
