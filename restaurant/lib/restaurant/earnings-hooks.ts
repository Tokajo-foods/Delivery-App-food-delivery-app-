import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { LIVE_INTERVALS, liveRefetchInterval, useAppIsActive } from '@/lib/live-query';
import { useMyRestaurantId } from '@/lib/order/hooks';
import { restaurantEarningsApi } from '@/lib/restaurant/earnings-api';
import { earningsKeys } from '@/lib/restaurant/earnings-keys';
import type { EarningsPeriod, PassbookFilter } from '@/lib/restaurant/earnings-types';

const EARNINGS_POLL_MS = LIVE_INTERVALS.dashboard;

function liveOptions(isActive: boolean) {
  return {
    staleTime: 15_000,
    refetchInterval: liveRefetchInterval(EARNINGS_POLL_MS, isActive),
    refetchIntervalInBackground: false as const,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  };
}

export function useEarningsSummary() {
  const restaurantQuery = useMyRestaurantId();
  const restaurantId = restaurantQuery.data?.id ?? '';
  const isActive = useAppIsActive();

  const query = useQuery({
    queryKey: earningsKeys.summary(restaurantId),
    queryFn: () => restaurantEarningsApi.getSummary(restaurantId),
    enabled: Boolean(restaurantId),
    placeholderData: (previous) => previous,
    ...liveOptions(isActive),
  });

  return { ...query, restaurantId, restaurantLoading: restaurantQuery.isLoading };
}

export function useEarningsPassbook(period: EarningsPeriod, filter: PassbookFilter) {
  const restaurantQuery = useMyRestaurantId();
  const restaurantId = restaurantQuery.data?.id ?? '';
  const isActive = useAppIsActive();

  const query = useInfiniteQuery({
    queryKey: earningsKeys.passbook(restaurantId, period, filter),
    queryFn: ({ pageParam }) =>
      restaurantEarningsApi.listPassbook(restaurantId, { period, filter, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: Boolean(restaurantId),
    ...liveOptions(isActive),
  });

  const entries = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, restaurantId, entries, total };
}
