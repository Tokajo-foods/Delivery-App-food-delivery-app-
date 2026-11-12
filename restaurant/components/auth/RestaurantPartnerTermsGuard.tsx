import { useEffect, useState } from 'react';

import { RestaurantPartnerTermsGate } from '@/components/auth/RestaurantPartnerTermsGate';
import {
  useInvalidatePartnerTerms,
  useRestaurantPartnerTermsStatus,
} from '@/lib/user/partner-terms-hooks';

type Props = {
  active: boolean;
};

/**
 * Blocks the kitchen home until partner terms are accepted (after signup + restaurant registration).
 */
export function RestaurantPartnerTermsGuard({ active }: Props) {
  const status = useRestaurantPartnerTermsStatus(active);
  const invalidate = useInvalidatePartnerTerms();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [active, status.data?.accepted]);

  const blocked =
    active
    && !dismissed
    && (
      status.isLoading
      || status.isError
      || (status.data?.required === true && status.data?.accepted !== true)
    );

  const onAccepted = () => {
    setDismissed(true);
    invalidate();
  };

  return (
    <RestaurantPartnerTermsGate
      visible={Boolean(blocked)}
      loading={status.isLoading}
      loadError={status.isError ? 'Could not load terms status.' : null}
      onRetry={() => void status.refetch()}
      onAccepted={onAccepted}
    />
  );
}
