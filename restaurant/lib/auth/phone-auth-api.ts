import { authClientSource, getAuthDeviceId } from '@/lib/auth/device';
import { AUTH_BASE, authRequest } from '@/lib/auth/http';
import {
  normalizeAuthResponse,
  normalizeMessageResponse,
  unwrapData,
} from '@/lib/auth/auth-normalize';
import type {
  PhoneAuthResult,
  PhoneAuthStatus,
  PhoneForgotPasswordResult,
  PhoneLoginPayload,
  PhoneRegisterPayload,
  PartnerRole,
} from '@/lib/auth/types';
import { toApiRole } from '@/lib/auth/types';

const PHONE_BASE = `${AUTH_BASE}/phone`;

export type PhoneCheckPurpose = 'login' | 'register' | 'forgot_password';

function toPhoneAuthResult(data: unknown, role: PartnerRole): PhoneAuthResult {
  const nested = unwrapData(data);
  return {
    ...normalizeAuthResponse(data, role),
    linkedExistingAccount: Boolean(nested.linkedExistingAccount),
    passwordSet: nested.passwordSet !== false,
  };
}

function positiveInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
}

/** Firebase phone OTP auth: `/api/v1/user-service/auth/phone/*`. */
export const phoneAuthApi = {
  status: async (): Promise<PhoneAuthStatus> => {
    const data = unwrapData(await authRequest<unknown>(`${PHONE_BASE}/status`));
    return {
      firebaseConfigured: Boolean(data.firebaseConfigured),
      provider: 'firebase',
      otpLength: positiveInt(data.otpLength, 6),
      resendCooldownSeconds: positiveInt(data.resendCooldownSeconds, 30),
      tokenMaxAgeSeconds: positiveInt(data.tokenMaxAgeSeconds, 600),
    };
  },

  /** Before the Firebase SMS: throws USER_NOT_FOUND / ROLE_NOT_ALLOWED / PHONE_ALREADY_REGISTERED. */
  check: async (
    phone: string,
    role: PartnerRole,
    purpose: PhoneCheckPurpose
  ): Promise<{ exists: boolean; linkExistingAccount: boolean }> => {
    const data = unwrapData(
      await authRequest<unknown>(`${PHONE_BASE}/check`, {
        method: 'POST',
        body: { phone, role: toApiRole(role), purpose },
      })
    );
    return {
      exists: Boolean(data.exists),
      linkExistingAccount: Boolean(data.linkExistingAccount),
    };
  },

  register: async (payload: PhoneRegisterPayload): Promise<PhoneAuthResult> => {
    const data = await authRequest<unknown>(`${PHONE_BASE}/register`, {
      method: 'POST',
      body: {
        idToken: payload.idToken,
        role: toApiRole(payload.role),
        firstName: payload.firstName,
        ...(payload.lastName ? { lastName: payload.lastName } : {}),
        ...(payload.email ? { email: payload.email } : {}),
        ...(payload.password ? { password: payload.password } : {}),
        ...(payload.phone ? { phone: payload.phone } : {}),
        source: authClientSource(),
        deviceId: await getAuthDeviceId(),
      },
    });
    return toPhoneAuthResult(data, payload.role);
  },

  login: async (payload: PhoneLoginPayload): Promise<PhoneAuthResult> => {
    const data = await authRequest<unknown>(`${PHONE_BASE}/login`, {
      method: 'POST',
      body: {
        idToken: payload.idToken,
        role: toApiRole(payload.role),
        ...(payload.phone ? { phone: payload.phone } : {}),
        deviceId: await getAuthDeviceId(),
      },
    });
    return toPhoneAuthResult(data, payload.role);
  },

  forgotPassword: async (payload: {
    idToken: string;
    phone?: string;
  }): Promise<PhoneForgotPasswordResult> => {
    const data = unwrapData(
      await authRequest<unknown>(`${PHONE_BASE}/forgot-password`, {
        method: 'POST',
        body: {
          idToken: payload.idToken,
          ...(payload.phone ? { phone: payload.phone } : {}),
        },
      })
    );
    const resetToken = String(data.resetToken ?? '');
    if (!resetToken) {
      throw new Error('Server did not return a password reset session.');
    }
    return {
      resetToken,
      expiresInSeconds: positiveInt(data.expiresInSeconds, 600),
      maskedPhone: String(data.phone ?? payload.phone ?? ''),
    };
  },

  resetPassword: async (payload: { resetToken: string; newPassword: string }) => {
    const data = await authRequest<unknown>(`${PHONE_BASE}/reset-password`, {
      method: 'POST',
      body: payload,
    });
    return normalizeMessageResponse(data);
  },
};
