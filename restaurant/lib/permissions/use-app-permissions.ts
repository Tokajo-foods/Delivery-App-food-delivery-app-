import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { permissionIds } from '@/lib/permissions/catalog';
import {
  allPermissionsGranted,
  snapshotAppPermissions,
} from '@/lib/permissions/check-permissions';
import { requestAllAppPermissions, requestAppPermission } from '@/lib/permissions/request-permissions';
import type { PermissionId, PermissionSnapshot } from '@/lib/permissions/types';
import { useAuthStore } from '@/store/auth-store';

export function useAppPermissions() {
  const role = useAuthStore((s) => s.role);
  const variant = String(Constants.expoConfig?.extra?.appVariant ?? '').toLowerCase();
  const includeRiderBackground = role === 'delivery' || variant === 'delivery';
  const [rows, setRows] = useState<PermissionSnapshot[]>([]);
  const [loading, setLoading] = useState(Platform.OS !== 'web');
  const [requesting, setRequesting] = useState(false);
  const prompted = useRef(new Set<PermissionId>());
  const running = useRef(false);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await snapshotAppPermissions({ includeRiderBackground });
      setRows(next);
    } finally {
      setLoading(false);
    }
  }, [includeRiderBackground]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const allGranted = useMemo(() => allPermissionsGranted(rows), [rows]);

  const requestOne = useCallback(
    async (id: PermissionId) => {
      setRequesting(true);
      try {
        await requestAppPermission(id);
        await refresh();
      } finally {
        setRequesting(false);
      }
    },
    [refresh],
  );

  const requestAll = useCallback(async () => {
    setRequesting(true);
    try {
      await requestAllAppPermissions(
        permissionIds({ includeRiderBackground }),
      );
      await refresh();
    } finally {
      setRequesting(false);
    }
  }, [includeRiderBackground, refresh]);

  /** System Allow dialogs only. Already-granted permissions are skipped. */
  const promptMissing = useCallback(async (only?: PermissionId[]) => {
    if (Platform.OS === 'web' || running.current) return;
    running.current = true;
    setRequesting(true);
    try {
      const next = await snapshotAppPermissions({ includeRiderBackground });
      setRows(next);
      const limit = only?.length ? new Set(only) : null;
      for (const row of next) {
        if (limit && !limit.has(row.id)) continue;
        if (row.status === 'granted' || prompted.current.has(row.id)) continue;
        prompted.current.add(row.id);
        await requestAppPermission(row.id);
      }
      const after = await snapshotAppPermissions({ includeRiderBackground });
      setRows(after);
    } finally {
      running.current = false;
      setRequesting(false);
      setLoading(false);
    }
  }, [includeRiderBackground]);

  return {
    rows,
    loading,
    requesting,
    allGranted,
    refresh,
    requestOne,
    requestAll,
    promptMissing,
    needsGate: Platform.OS !== 'web' && !loading && !allGranted,
  };
}
