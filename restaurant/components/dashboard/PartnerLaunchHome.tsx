import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';

import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import { waitForLaunchPush } from '@/lib/notification/launch-push';

/** Cold/warm start lands on Home unless this launch came from a notification tap. */
export function PartnerLaunchHome({
  role,
}: {
  role: 'restaurant' | 'delivery';
}) {
  const router = useRouter();
  const segments = useSegments();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const home = role === 'delivery' ? DELIVERY_ROUTES.home : '/dashboard';
    void waitForLaunchPush().then((fromPush) => {
      if (fromPush) return;
      if (role === 'restaurant' && segments.includes('dashboard')) return;
      if (role === 'delivery' && segments.includes('delivery') && !segments.includes('notifications')) {
        return;
      }
      router.replace(home as never);
    });
  }, [role, router, segments]);

  return null;
}
