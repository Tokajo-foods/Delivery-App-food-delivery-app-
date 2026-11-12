import { authClientSource, getAuthDeviceId } from '@/lib/auth/device';
import { AUTH_BASE, authRequest } from '@/lib/auth/http';
import {
  normalizeAuthResponse,
  normalizeMessageResponse,
  normalizeOtpSendResponse,
  unwrapData,
} from '@/lib/auth/auth-normalize';
import type {
  AppleLoginPayload,
  ConfirmForgotPasswordOtpPayload,
  ConfirmRegisterOtpResult,
  ForgotPasswordPayload,
  GoogleLoginPayload,
  LoginPayload,
  OtpSendPayload,
  OtpVerifyPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ResetPasswordWithOtpPayload,
} from '@/lib/auth/types';
import { toApiRole } from '@/lib/auth/types';

export { AUTH_ERROR_COPY, formatAuthError } from '@/lib/auth/auth-error-copy';
export { SESSION_AUTH_TOKEN } from '@/lib/auth/auth-normalize';
export { AuthApiError, isAuthApiError } from '@/lib/auth/http';
export { phoneAuthApi } from '@/lib/auth/phone-auth-api';

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/register`, {
      method: 'POST',
      body: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        role: toApiRole(payload.role),
        source: authClientSource(),
        deviceId: await getAuthDeviceId(),
      },
    });
    return normalizeAuthResponse(data, payload.role);
  },

  login: async (payload: LoginPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/login`, {
      method: 'POST',
      body: {
        email: payload.email,
        password: payload.password,
        role: toApiRole(payload.role),
        source: authClientSource(),
        deviceId: await getAuthDeviceId(),
      },
    });
    return normalizeAuthResponse(data, payload.role);
  },

  sendOtp: async (payload: OtpSendPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/otp/send`, {
      method: 'POST',
      body: {
        identifier: payload.emailOrPhone,
        purpose: payload.purpose ?? 'login',
        ...(payload.role ? { role: toApiRole(payload.role) } : {}),
      },
    });
    return normalizeOtpSendResponse(data);
  },

  resendOtp: async (payload: OtpSendPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/otp/resend`, {
      method: 'POST',
      body: {
        identifier: payload.emailOrPhone,
        purpose: payload.purpose ?? 'login',
        ...(payload.role ? { role: toApiRole(payload.role) } : {}),
      },
    });
    return normalizeOtpSendResponse(data);
  },

  verifyOtp: async (payload: OtpVerifyPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/otp/verify`, {
      method: 'POST',
      body: {
        identifier: payload.emailOrPhone,
        otp: payload.otp,
        purpose: payload.purpose ?? 'login',
        source: authClientSource(),
        deviceId: await getAuthDeviceId(),
      },
    });
    return normalizeAuthResponse(data, payload.role);
  },

  loginGoogle: async (payload: GoogleLoginPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/social/google`, {
      method: 'POST',
      body: {
        idToken: payload.idToken,
        source: authClientSource(),
        deviceId: await getAuthDeviceId(),
        role: toApiRole(payload.role),
      },
    });
    return normalizeAuthResponse(data, payload.role);
  },

  loginApple: async (payload: AppleLoginPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/social/apple`, {
      method: 'POST',
      body: {
        identityToken: payload.identityToken,
        authorizationCode: payload.authorizationCode,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        source: authClientSource(),
        deviceId: await getAuthDeviceId(),
        role: toApiRole(payload.role),
      },
    });
    return normalizeAuthResponse(data, payload.role);
  },

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/forgot-password`, {
      method: 'POST',
      body: payload,
    });
    return normalizeMessageResponse(data);
  },

  /** Email-OTP password reset fallback (phone uses `phoneAuthApi`). */
  confirmForgotPasswordOtp: async (
    payload: ConfirmForgotPasswordOtpPayload
  ): Promise<ConfirmRegisterOtpResult> => {
    const data = await authRequest<unknown>(
      `${AUTH_BASE}/otp/confirm-forgot-password`,
      {
        method: 'POST',
        body: { identifier: payload.emailOrPhone, otp: payload.otp },
      }
    );
    const nested = unwrapData(data);
    return {
      channel: nested.channel === 'phone' ? 'phone' : 'email',
      identifier: String(nested.identifier ?? payload.emailOrPhone),
      verified: true,
      message: normalizeMessageResponse(data).message,
    };
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/reset-password`, {
      method: 'POST',
      body: { token: payload.token, newPassword: payload.password },
    });
    return normalizeMessageResponse(data);
  },

  resetPasswordWithOtp: async (payload: ResetPasswordWithOtpPayload) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/reset-password`, {
      method: 'POST',
      body: { identifier: payload.identifier, newPassword: payload.password },
    });
    return normalizeMessageResponse(data);
  },

  verifyEmail: async (token: string) => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/email/verify/${token}`);
    return normalizeMessageResponse(data);
  },

  logout: async () => {
    // Empty JSON body so Content-Type: application/json is sent
    // (gateway rejects POSTs without JSON media type).
    const data = await authRequest<unknown>(`${AUTH_BASE}/logout`, {
      method: 'POST',
      body: {},
    });
    return normalizeMessageResponse(data);
  },

  logoutAll: async () => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/logout-all`, {
      method: 'POST',
      body: {},
    });
    return normalizeMessageResponse(data);
  },

  resendEmailVerification: async () => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/email/send-verify`, {
      method: 'POST',
      body: {},
    });
    return normalizeMessageResponse(data);
  },

  getRegisterPolicy: async () => {
    const data = unwrapData(await authRequest<unknown>(`${AUTH_BASE}/register-policy`));
    return {
      requireEmailOtp: Boolean(data.requireEmailOtp),
      requirePhoneOtp: Boolean(data.requirePhoneOtp),
      phoneProvider: String(data.phoneProvider ?? 'firebase') as 'firebase' | 'sms',
      resendCooldownSeconds: Number(data.resendCooldownSeconds ?? 30),
      resendMax: Number(data.resendMax ?? 5),
    };
  },

  confirmRegisterOtp: async (payload: {
    emailOrPhone: string;
    otp: string;
    role?: import('@/lib/auth/types').PartnerRole;
  }): Promise<ConfirmRegisterOtpResult> => {
    const data = await authRequest<unknown>(`${AUTH_BASE}/otp/confirm-register`, {
      method: 'POST',
      body: {
        identifier: payload.emailOrPhone,
        otp: payload.otp,
        ...(payload.role ? { role: toApiRole(payload.role) } : {}),
      },
    });
    const nested = unwrapData(data);
    return {
      channel: nested.channel === 'phone' ? 'phone' : 'email',
      identifier: String(nested.identifier ?? payload.emailOrPhone),
      verified: true,
      message: normalizeMessageResponse(data).message,
    };
  },

  /** GET /api/v1/user-service/health — user-service liveness. */
  health: async () => {
    const data = await authRequest<unknown>('/api/v1/user-service/health');
    const payload =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const status = String(payload.status ?? payload.state ?? 'ok');
    return { status, service: String(payload.service ?? 'user-service') };
  },
};
