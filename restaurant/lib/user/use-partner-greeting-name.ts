import { useEffect, useMemo, useRef, useState } from 'react';

import { lockedPartnerRole } from '@/lib/app-variant';
import { loadPartnerSignupName } from '@/lib/auth/partner-signup-name-storage';
import { partnerGreetingName } from '@/lib/user/partner-display-name';
import { usePlatformMe } from '@/lib/user/account-hooks';
import {
  needsRestaurantPartnerNameSync,
  restaurantPartnerLabelFromMe,
  syncRestaurantPartnerNameFromRecord,
} from '@/lib/user/partner-signup-sync';
import { useAuthStore } from '@/store/auth-store';

/** Kitchen home greeting — partner signup name, not shared customer first/last. */
export function usePartnerGreetingName(enabled = true): string {
  const portal = lockedPartnerRole() ?? 'restaurant';
  const user = useAuthStore((s) => s.user);
  const me = usePlatformMe(enabled && portal === 'restaurant' && Boolean(user?.id));
  const syncRef = useRef(false);
  const [localLabel, setLocalLabel] = useState<string | null>(null);

  const serverPartnerName =
    restaurantPartnerLabelFromMe(me.data) ??
    user?.partnerSignupNameRestaurant?.trim() ??
    null;

  useEffect(() => {
    if (portal !== 'restaurant' || !user?.id) return;
    void loadPartnerSignupName(user.id, user.phone).then((local) => {
      setLocalLabel(local ? [local.firstName, local.lastName].filter(Boolean).join(' ') : null);
    });
  }, [portal, user?.id, user?.phone]);

  useEffect(() => {
    if (!enabled || portal !== 'restaurant' || !user?.id) return;
    if (syncRef.current) return;

    let cancelled = false;
    void (async () => {
      const local = await loadPartnerSignupName(user.id, user.phone);
      if (cancelled || !local) return;
      if (!needsRestaurantPartnerNameSync(local, me.data)) return;

      syncRef.current = true;
      const updated = await syncRestaurantPartnerNameFromRecord(
        local,
        user.id,
        user.phone,
      );
      if (!cancelled && updated) {
        await me.refetch();
      } else if (!updated) {
        syncRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    portal,
    user?.id,
    user?.phone,
    serverPartnerName,
    me.data?.partnerSignupNameRestaurant,
    me,
  ]);

  return useMemo(() => {
    if (serverPartnerName) return serverPartnerName;
    if (localLabel) return localLabel;
    return partnerGreetingName(user);
  }, [serverPartnerName, localLabel, user]);
}

/** Runs partner-name sync for every signed-in restaurant screen (dashboard, setup, etc.). */
export function useRestaurantPartnerNameSync(): void {
  const portal = lockedPartnerRole() ?? 'restaurant';
  const user = useAuthStore((s) => s.user);
  usePartnerGreetingName(
    portal === 'restaurant' && Boolean(user?.id),
  );
}
