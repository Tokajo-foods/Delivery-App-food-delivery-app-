import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { RiderPartnerPolicyModalGate } from '@/components/delivery/policy/RiderPartnerPolicyModalGate';
import { useDeliveryPartnerMe } from '@/lib/delivery-partner/hooks';
import {
  useInvalidateRiderPolicy,
  useRiderPolicyStatus,
} from '@/lib/delivery-partner/policy-hooks';

type Props = {
  active: boolean;
};

/**
 * Blocks the rider home (same as restaurant) until the onboarding policy is accepted.
 * Home stays mounted behind a blurred modal.
 */
export function RiderPartnerPolicyGuard({ active }: Props) {
  const me = useDeliveryPartnerMe(active);
  const policyEnabled = active && Boolean(me.data?.id);
  const status = useRiderPolicyStatus(policyEnabled);
  const invalidate = useInvalidateRiderPolicy();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [active, me.data?.id, status.data?.accepted]);

  useEffect(() => {
    if (!policyEnabled) return;
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') void status.refetch();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [policyEnabled, status.refetch]);

  const blocked =
    policyEnabled
    && !dismissed
    && (status.isLoading
      || status.isError
      || status.data?.accepted !== true);

  const onAccepted = () => {
    setDismissed(true);
    invalidate();
  };

  return (
    <RiderPartnerPolicyModalGate
      visible={Boolean(blocked)}
      loading={status.isLoading}
      loadError={status.isError ? 'Could not load rider policy status.' : null}
      onRetry={() => void status.refetch()}
      onAccepted={onAccepted}
    />
  );
}
