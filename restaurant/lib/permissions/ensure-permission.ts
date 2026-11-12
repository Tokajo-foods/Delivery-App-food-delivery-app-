import { getAppPermissionStatus } from '@/lib/permissions/check-permissions';
import { requestAppPermission } from '@/lib/permissions/request-permissions';
import type { PermissionId } from '@/lib/permissions/types';

/**
 * Ask the OS only when needed: granted → no dialog; otherwise system Allow / Don't allow.
 * Call again on the next feature use if the rider previously denied.
 */
export async function ensureAppPermission(id: PermissionId): Promise<boolean> {
  const current = await getAppPermissionStatus(id);
  if (current === 'granted') return true;
  const next = await requestAppPermission(id);
  return next === 'granted';
}
