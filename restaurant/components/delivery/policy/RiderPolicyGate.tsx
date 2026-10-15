import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useDeliveryPartnerMe } from '@/lib/delivery-partner/hooks';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import { useRiderPolicyStatus } from '@/lib/delivery-partner/policy-hooks';

const OPEN_PATHS = new Set<string>([DELIVERY_ROUTES.policy, DELIVERY_ROUTES.setup]);

/** Sends a rider to the onboarding policy until the current version is accepted. */
export function RiderPolicyGate({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const me = useDeliveryPartnerMe(enabled);
  const policy = useRiderPolicyStatus(enabled && Boolean(me.data?.id));
  const mustAccept = policy.data != null && !policy.data.accepted;

  useEffect(() => {
    if (!enabled || !mustAccept) return;
    if (OPEN_PATHS.has(pathname)) return;
    router.replace(DELIVERY_ROUTES.policy as never);
  }, [enabled, mustAccept, pathname, router]);

  return null;
}
