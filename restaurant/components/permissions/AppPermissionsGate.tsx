import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAppPermissions } from '@/lib/permissions/use-app-permissions';
import type { PermissionId } from '@/lib/permissions/types';

type Props = {
  enabled?: boolean;
  /** When set, only these permissions are offered. Granted ones are still skipped. */
  ids?: PermissionId[];
};

/**
 * Asks the operating system for permissions that are still off.
 * Already allowed permissions do not show an Allow dialog.
 */
export function AppPermissionsGate({ enabled = true, ids }: Props) {
  const { promptMissing } = useAppPermissions();
  const idsKey = ids?.join(',') ?? '';

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    void promptMissing(ids);
  }, [enabled, promptMissing, idsKey]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void promptMissing(ids);
    });
    return () => sub.remove();
  }, [enabled, promptMissing, idsKey]);

  return null;
}
