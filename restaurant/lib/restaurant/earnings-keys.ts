import type { EarningsPeriod, PassbookFilter } from '@/lib/restaurant/earnings-types';

export const earningsKeys = {
  all: ['restaurant-earnings'] as const,
  restaurant: (restaurantId: string) => [...earningsKeys.all, restaurantId] as const,
  summary: (restaurantId: string) =>
    [...earningsKeys.restaurant(restaurantId), 'summary'] as const,
  passbook: (restaurantId: string, period: EarningsPeriod, filter: PassbookFilter) =>
    [...earningsKeys.restaurant(restaurantId), 'passbook', period, filter] as const,
};
