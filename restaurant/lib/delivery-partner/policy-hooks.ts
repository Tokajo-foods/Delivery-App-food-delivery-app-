import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deliveryPartnerKeys } from '@/lib/delivery-partner/hooks';
import { riderPolicyApi } from '@/lib/delivery-partner/policy-api';

export const riderPolicyKeys = {
  status: () => [...deliveryPartnerKeys.all, 'policy'] as const,
};

export function useRiderPolicyStatus(enabled = true) {
  return useQuery({
    queryKey: riderPolicyKeys.status(),
    queryFn: () => riderPolicyApi.getStatus(),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    placeholderData: (previous) => previous,
  });
}

export function useAcceptRiderPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (version: string) => riderPolicyApi.accept(version),
    onSuccess: (status) => {
      queryClient.setQueryData(riderPolicyKeys.status(), status);
    },
  });
}
