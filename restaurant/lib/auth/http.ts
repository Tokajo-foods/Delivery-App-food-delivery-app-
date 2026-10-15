import axios from 'axios';

import { API_BASE_URL, api, assertApiBaseUrl } from '@/lib/api';
import { AUTH_ERROR_COPY } from '@/lib/auth/auth-error-copy';
import { PartnerApiError } from '@/lib/errors';

/** Live API mounts auth under user-service (not /auth at root). */
export const AUTH_BASE = '/api/v1/user-service/auth';

export type AuthFieldErrors = Record<string, string[]>;

/** Auth error with backend `code` + HTTP status so screens can branch on it. */
export class AuthApiError extends PartnerApiError {
  status?: number;
  fieldErrors?: AuthFieldErrors;

  constructor(
    message: string,
    code?: string,
    status?: number,
    fieldErrors?: AuthFieldErrors
  ) {
    super(message, code);
    this.name = 'AuthApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isAuthApiError(error: unknown): error is AuthApiError {
  return error instanceof AuthApiError;
}

type ErrorPayload = {
  message?: string;
  error?: string;
  code?: string;
  errors?: AuthFieldErrors | string[];
} | null;

function extractFieldErrors(data: unknown): AuthFieldErrors | undefined {
  const errors = (data as ErrorPayload)?.errors;
  if (!errors || Array.isArray(errors) || typeof errors !== 'object') {
    return undefined;
  }
  return errors;
}

function extractErrorMessage(data: unknown, fallback: string): string {
  const payload = data as ErrorPayload;

  if (payload?.errors) {
    const details = Array.isArray(payload.errors)
      ? payload.errors.filter(Boolean)
      : Object.values(payload.errors).flat().filter(Boolean);
    if (details.length > 0) return details.join('\n');
  }

  const code =
    typeof payload?.code === 'string' ? payload.code.trim().toUpperCase() : '';
  if (code && AUTH_ERROR_COPY[code]) return AUTH_ERROR_COPY[code];

  return payload?.message || payload?.error || fallback;
}

function extractErrorCode(data: unknown): string | undefined {
  const payload = data as { code?: unknown } | null;
  if (typeof payload?.code === 'string' && payload.code.trim()) {
    return payload.code.trim().toUpperCase().replace(/[\s-]+/g, '_');
  }
  return undefined;
}

function toAuthApiError(error: unknown): unknown {
  if (!axios.isAxiosError(error)) return error;

  if (!error.response) {
    return new AuthApiError(
      `Network request failed. Cannot reach ${API_BASE_URL}. Same Wi‑Fi as PC, Expo Go only, then reload.`,
      'NETWORK_ERROR'
    );
  }

  const { status, data } = error.response;
  const message = extractErrorMessage(data, `Request failed (${status})`);
  const code = extractErrorCode(data);
  const lower = message.toLowerCase();

  if (lower.includes('csrf')) {
    return new AuthApiError(
      'Security token expired. Close and reopen the app, then try again.',
      'CSRF_FAILED',
      status
    );
  }

  if (message.includes('generatePasswordResetToken')) {
    return new AuthApiError(
      'Password reset is broken on the server. Backend must define User.generatePasswordResetToken (and not use .lean() when calling it).',
      'SERVER_MISCONFIGURED',
      status
    );
  }

  if (
    lower.includes('generateemailverificationtoken') ||
    lower.includes('generate email verification token')
  ) {
    return new AuthApiError(
      'Email verification is broken on the server. Backend must define User.generateEmailVerificationToken on the User model (and call it on a Mongoose document, not a .lean() plain object).',
      'SERVER_MISCONFIGURED',
      status
    );
  }

  return new AuthApiError(message, code, status, extractFieldErrors(data));
}

/** Shared request helper for user-service auth (cookie `_sid` + CSRF via `lib/api`). */
export async function authRequest<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<T> {
  const { method = 'GET', body } = options;

  assertApiBaseUrl();

  try {
    const response = await api.request<T>({
      url: path,
      method,
      data: method === 'GET' || method === 'DELETE' ? undefined : body,
    });
    return response.data;
  } catch (error) {
    throw toAuthApiError(error);
  }
}
