import type {
  AuthResponse,
  AuthUser,
  MessageResponse,
  OtpSendResult,
  PartnerRole,
} from '@/lib/auth/types';
import { fromApiRole } from '@/lib/auth/types';
import { PartnerApiError } from '@/lib/errors';

/** Cookie session auth — no JWT in response body. */
export const SESSION_AUTH_TOKEN = 'session';

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

/** `{ success, data }` envelope → `data` (or the payload itself). */
export function unwrapData(value: unknown): Record<string, unknown> {
  const payload = asRecord(value);
  return payload.data && typeof payload.data === 'object'
    ? (payload.data as Record<string, unknown>)
    : payload;
}

function readPartnerSignupRestaurant(data: Record<string, unknown>): string | undefined {
  const nested = data.partnerSignupNames;
  if (nested && typeof nested === 'object') {
    const label = String((nested as Record<string, unknown>).restaurant_owner ?? '').trim();
    if (label) return label;
  }
  return undefined;
}

function mapApiUser(
  data: Record<string, unknown>,
  fallbackRole: PartnerRole
): AuthUser {
  const partnerSignupNameRestaurant = readPartnerSignupRestaurant(data);
  return {
    id: String(data._id ?? data.id ?? ''),
    email: String(data.email ?? ''),
    firstName: (data.firstName as string) || undefined,
    lastName: (data.lastName as string) || undefined,
    partnerSignupNameRestaurant,
    phone: (data.phone as string) || undefined,
    role: fromApiRole(data.role ?? data.userType ?? data.type, fallbackRole),
    emailVerified: Boolean(data.isEmailVerified ?? data.emailVerified ?? false),
    photoUrl:
      (data.photoUrl as string) ||
      (data.avatarUrl as string) ||
      (data.profilePhoto as string) ||
      (data.picture as string) ||
      undefined,
  };
}

export function normalizeAuthResponse(
  data: unknown,
  fallbackRole: PartnerRole
): AuthResponse {
  const payload = asRecord(data);
  const nested = payload.data as Record<string, unknown> | undefined;

  const token =
    (payload.token as string) ||
    (payload.accessToken as string) ||
    (payload.access_token as string) ||
    (payload.jwt as string) ||
    (nested?.token as string) ||
    (nested?.accessToken as string) ||
    ((nested?.tokens as Record<string, unknown> | undefined)?.accessToken as string) ||
    SESSION_AUTH_TOKEN;

  const userSource = (nested?.user ??
    nested ??
    payload.user ??
    payload) as Record<string, unknown>;
  const user = mapApiUser(userSource, fallbackRole);

  if (!user.id) {
    throw new PartnerApiError(
      'Invalid authentication response from server',
      'INVALID_AUTH_RESPONSE'
    );
  }
  if (!user.email) {
    user.email = user.phone || `${user.id}@tokajo.local`;
  }

  return { token, user, message: payload.message as string | undefined };
}

export function normalizeMessageResponse(data: unknown): MessageResponse {
  const payload = data as { message?: string; data?: { message?: string } };
  return {
    message: payload?.data?.message ?? payload?.message ?? 'Success',
  };
}

function pickPositiveSeconds(data: unknown, key: string, fallback: number) {
  const raw = Number(unwrapData(data)[key] ?? asRecord(data)[key]);
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw);
  return fallback;
}

export function normalizeOtpSendResponse(data: unknown): OtpSendResult {
  return {
    message: normalizeMessageResponse(data).message || 'OTP sent',
    cooldownSeconds: pickPositiveSeconds(data, 'cooldownSeconds', 30),
    expiresInSeconds: pickPositiveSeconds(data, 'expiresInSeconds', 600),
  };
}
