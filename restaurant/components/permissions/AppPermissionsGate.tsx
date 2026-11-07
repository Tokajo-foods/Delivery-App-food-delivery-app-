import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAppPermissions } from '@/lib/permissions/use-app-permissions';

type Props = {
  enabled: boolean;
};

/**
 * After the splash, ask the operating system for permissions that are still off.
 * Granted permissions are left alone, so the phone does not show Allow again.
 */
export function AppPermissionsGate({ enabled }: Props) {
  const { promptMissing } = useAppPermissions();

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    void promptMissing();
  }, [enabled, promptMissing]);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void promptMissing();
    });
    return () => sub.remove();
  }, [enabled, promptMissing]);

  return null;
}
