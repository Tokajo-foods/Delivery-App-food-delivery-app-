import { api, assertApiBaseUrl } from '@/lib/api';
import type { NotificationPrefs } from '@/lib/user/account-types';

const PATH = '/api/v1/delivery-service/partners/me/notifications/preferences';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickBool(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  if (typeof value === 'boolean') return value;
  return undefined;
}

export async function getRiderAlertPrefs(): Promise<NotificationPrefs | null> {
  assertApiBaseUrl();
  const response = await api.request<unknown>({ url: PATH, method: 'GET' });
  const body = asRecord(response.data);
  const data = asRecord('data' in body ? body.data : body);
  const push = pickBool(data, 'push');
  const sms = pickBool(data, 'sms');
  const email = pickBool(data, 'email');
  if (push == null && sms == null && email == null) return null;
  return {
    push: push ?? true,
    sms: sms ?? true,
    email: email ?? true,
  };
}

export async function saveRiderAlertPrefs(prefs: NotificationPrefs): Promise<void> {
  assertApiBaseUrl();
  await api.request({
    url: PATH,
    method: 'PUT',
    data: { push: prefs.push, sms: prefs.sms, email: prefs.email },
  });
}
