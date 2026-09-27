import Stripe from 'stripe';

import {
  IConnectStatusResponse,
  TConnectUiState,
} from '@/app/modules/connect/connect.types';

const hasRequirements = (
  requirements: Stripe.Account.Requirements | null | undefined
) =>
  Boolean(
    requirements &&
    ((requirements.currently_due?.length ?? 0) > 0 ||
      (requirements.past_due?.length ?? 0) > 0 ||
      (requirements.errors?.length ?? 0) > 0)
  );

/** Derives the sanitized UI state from Stripe's authoritative account fields. */
export const getConnectUiState = (account: Stripe.Account): TConnectUiState => {
  const transfers = account.capabilities?.transfers;
  const disabledReason = account.requirements?.disabled_reason ?? '';

  if (transfers === 'active' && account.payouts_enabled) return 'READY';
  if (
    transfers === 'disabled' ||
    disabledReason.startsWith('rejected.') ||
    disabledReason === 'other'
  ) {
    return 'RESTRICTED';
  }
  if (hasRequirements(account.requirements)) return 'ACTION_REQUIRED';
  return 'IN_PROGRESS';
};

/** Formats the Flutter-safe Connect status response. */
export const formatConnectStatus = ({
  state,
  onboardingCompletedAt,
}: {
  state: TConnectUiState;
  onboardingCompletedAt: Date | null;
}): IConnectStatusResponse => ({
  state,
  onboardingCompletedAt,
  requiresOnboarding: state === 'IN_PROGRESS' || state === 'ACTION_REQUIRED',
  canCreateListings: state === 'READY',
});
