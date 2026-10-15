import { useQuery } from '@tanstack/react-query';

import { deliveryPartnerKeys } from '@/lib/delivery-partner/hooks';
import { getPartnerKyc } from '@/lib/delivery-partner/kyc-api';
import {
  LIVE_INTERVALS,
  liveRefetchInterval,
  useAppIsActive,
} from '@/lib/live-query';

/** GET /partners/me/kyc — required docs, blockers, canGoOnline. */
export function usePartnerKyc(enabled = true) {
  const isActive = useAppIsActive();
  return useQuery({
    queryKey: [...deliveryPartnerKeys.me(), 'kyc'] as const,
    queryFn: getPartnerKyc,
    enabled,
    staleTime: LIVE_INTERVALS.deliveryMe / 2,
    refetchInterval: liveRefetchInterval(LIVE_INTERVALS.deliveryMe, isActive),
  });
}
