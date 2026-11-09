import { useQuery, useQueryClient } from '@tanstack/react-query';

import { partnerTermsApi } from '@/lib/user/partner-terms-api';

export const partnerTermsKeys = {
  status: ['restaurant-partner-terms'] as const,
};

export function useRestaurantPartnerTermsStatus(enabled: boolean) {
  return useQuery({
    queryKey: partnerTermsKeys.status,
    queryFn: () => partnerTermsApi.getStatus(),
    enabled,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useInvalidatePartnerTerms() {
  const client = useQueryClient();
  return () =>
    client.invalidateQueries({ queryKey: partnerTermsKeys.status });
}
