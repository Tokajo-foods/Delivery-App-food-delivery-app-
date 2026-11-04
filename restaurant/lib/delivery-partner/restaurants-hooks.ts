import { useQuery } from '@tanstack/react-query';

import { deliveryPartnerKeys } from '@/lib/delivery-partner/hooks';
import {
  RIDER_RESTAURANTS_WINDOW_DAYS,
  riderRestaurantsApi,
} from '@/lib/delivery-partner/restaurants-api';
import {
  LIVE_INTERVALS,
  riderLiveQueryOptions,
  useAppIsActive,
} from '@/lib/live-query';

/** Under `deliveries` so trip socket events (rider-events) refresh it too. */
export const riderRestaurantsKeys = {
  list: (days: number) =>
    [...deliveryPartnerKeys.all, 'deliveries', 'by-restaurant', days] as const,
};

export function useRiderRestaurants(
  windowDays = RIDER_RESTAURANTS_WINDOW_DAYS,
  enabled = true
) {
  const isActive = useAppIsActive();

  return useQuery({
    queryKey: riderRestaurantsKeys.list(windowDays),
    queryFn: () => riderRestaurantsApi.getRestaurants(windowDays),
    enabled,
    ...riderLiveQueryOptions(isActive, LIVE_INTERVALS.deliveryRestaurants),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}
