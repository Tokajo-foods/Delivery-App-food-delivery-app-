import type { QueryClient } from '@tanstack/react-query';

import { analyticsKeys } from '@/lib/analytics/hooks';
import { dashboardKeys } from '@/lib/dashboard/hooks';
import { deliveryPartnerKeys } from '@/lib/delivery-partner/hooks';
import { setPartnerCommissionPercent } from '@/lib/delivery-partner/partner-earnings';
import { restaurantOrderKeys } from '@/lib/order/hooks';
import { earningsKeys } from '@/lib/restaurant/earnings-keys';
import { financeKeys } from '@/lib/restaurant/finance-hooks';

/**
 * Gateway `pricing:config_updated` — admin changed commission, charges, tax, or
 * delivery/rider pay. Every amount on screen is server-owned, so refetch it.
 */
export function invalidateKitchenPricing(queryClient: QueryClient) {
  for (const queryKey of [
    financeKeys.all,
    earningsKeys.all,
    analyticsKeys.all,
    dashboardKeys.all,
    restaurantOrderKeys.all,
  ]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'active' });
  }
}

export function invalidateRiderPricing(queryClient: QueryClient) {
  setPartnerCommissionPercent(null);
  void queryClient.invalidateQueries({
    queryKey: deliveryPartnerKeys.all,
    refetchType: 'active',
  });
}
