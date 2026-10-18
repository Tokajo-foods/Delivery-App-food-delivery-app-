import { unwrapData } from '@/lib/auth/auth-normalize';
import { AUTH_BASE, AuthApiError, authRequest } from '@/lib/auth/http';
import { mapPlatformUser } from '@/lib/user/account-api';
import type { PlatformUser } from '@/lib/user/account-types';

const PHONE_CHANGE = '/api/v1/user-service/users/me/contact/phone';
const PASSWORD_CHANGE = `${AUTH_BASE}/password/change`;

export type PasswordChangeStart = {
  emailRequired: boolean;
  phoneRequired: boolean;
  maskedEmail: string | null;
  phone: string | null;
  maskedPhone: string | null;
  emailOtpSent: boolean;
  cooldownSeconds: number;
};

const str = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

/** Settings: Firebase phone change (old number, then new number). */
export const phoneChangeApi = {
  verifyCurrent: async (idToken: string): Promise<void> => {
    await authRequest<unknown>(`${PHONE_CHANGE}/verify-current-firebase`, {
      method: 'POST',
      body: { idToken },
    });
  },

  confirmNew: async (idToken: string): Promise<PlatformUser> => {
    const data = await authRequest<unknown>(`${PHONE_CHANGE}/confirm-firebase`, {
      method: 'POST',
      body: { idToken },
    });
    return mapPlatformUser(data);
  },
};

/** Settings: password change after email OTP + Firebase phone OTP. */
export const passwordChangeApi = {
  start: async (): Promise<PasswordChangeStart> => {
    const raw = unwrapData(
      await authRequest<unknown>(`${PASSWORD_CHANGE}/start`, { method: 'POST', body: {} })
    );
    return {
      emailRequired: Boolean(raw.emailRequired),
      phoneRequired: Boolean(raw.phoneRequired),
      maskedEmail: str(raw.maskedEmail),
      phone: str(raw.phone),
      maskedPhone: str(raw.maskedPhone),
      emailOtpSent: Boolean(raw.emailOtpSent),
      cooldownSeconds: Number(raw.cooldownSeconds ?? 30) || 30,
    };
  },

  verify: async (input: { emailOtp?: string; phoneIdToken?: string }): Promise<string> => {
    const raw = unwrapData(
      await authRequest<unknown>(`${PASSWORD_CHANGE}/verify`, {
        method: 'POST',
        body: {
          ...(input.emailOtp ? { emailOtp: input.emailOtp } : {}),
          ...(input.phoneIdToken ? { phoneIdToken: input.phoneIdToken } : {}),
        },
      })
    );
    const token = str(raw.changeToken);
    if (!token) throw new AuthApiError('Server did not return a change token. Try again.');
    return token;
  },

  confirm: async (changeToken: string, newPassword: string): Promise<void> => {
    await authRequest<unknown>(`${PASSWORD_CHANGE}/confirm`, {
      method: 'POST',
      body: { changeToken, newPassword },
    });
  },
};
