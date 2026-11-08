import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAppPermissions } from '@/lib/permissions/use-app-permissions';
import type { PermissionId } from '@/lib/permissions/types';

type Props = {
  enabled?: boolean;
  /** When set, only these permissions are offered. Granted ones are still skipped. */
  ids?: PermissionId[];
};

/**
 * Asks once per app open for permissions that are still off.
 * Allowed permissions are not asked again. A denial is asked again on the next open.
 */
export function AppPermissionsGate({ enabled = true, ids }: Props) {
  const { promptMissing } = useAppPermissions();
  const idsKey = ids?.join(',') ?? '';

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    void promptMissing(ids);
  }, [enabled, promptMissing, idsKey]);

  return null;
}
