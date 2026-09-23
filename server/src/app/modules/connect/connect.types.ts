import { User } from '@prisma/client';

/** Sanitized Stripe Connect state exposed to Flutter clients. */
export type TConnectUiState =
  'SETUP_REQUIRED' | 'IN_PROGRESS' | 'ACTION_REQUIRED' | 'READY' | 'RESTRICTED';

/** Flutter-safe Stripe Connect status payload. */
export interface IConnectStatusResponse {
  state: TConnectUiState;
  onboardingCompletedAt: Date | null;
  requiresOnboarding: boolean;
  canCreateListings: boolean;
}

/** Parameters for creating or resuming Connect onboarding. */
export interface ICreateOrResumeConnectOnboardingService {
  user: User;
}

/** Parameters for retrieving Connect status. */
export interface IGetConnectStatusService {
  userId: string;
}

/** Parameters for creating a Stripe Account Link. */
export interface ICreateConnectAccountLinkService {
  userId: string;
  stripeAccountId: string;
}

/** Parameters for retrieving an account from Stripe. */
export interface IRetrieveConnectAccountService {
  stripeAccountId: string;
}

/** Parameters for refreshing Connect onboarding. */
export interface IRefreshConnectOnboardingService {
  userId: string;
}

/** Parameters for processing a raw Stripe Connect webhook. */
export interface IProcessConnectWebhookService {
  payload: Buffer;
  signature: string | undefined;
}
