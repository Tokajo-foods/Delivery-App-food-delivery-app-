import { PartnerApiError } from '@/lib/errors';

import {
  confirmNativePhoneOtp,
  getNativeFreshIdToken,
  getNativeVerifiedPhone,
  nativePhoneAuthAvailable,
  signOutNative,
  startNativePhoneOtp,
} from '@/lib/auth/firebase-phone-native';

export { NATIVE_AUTO_VERIFIED, nativePhoneAuthAvailable } from '@/lib/auth/firebase-phone-native';

const NATIVE_ONLY_MESSAGE =
  'Phone OTP works in the Tokajo dev or store app build (native Firebase). Expo Go and web are not supported.';

function requireNative(): void {
  if (!nativePhoneAuthAvailable()) {
    throw new PartnerApiError(NATIVE_ONLY_MESSAGE, 'PHONE_OTP_CLIENT_NOT_CONFIGURED');
  }
}

/** Native dev/production builds only — no web reCAPTCHA fallback. */
export function isFirebasePhoneConfigured(): boolean {
  return nativePhoneAuthAvailable();
}

/** @deprecated Web config unused; kept so older imports do not break. */
export function getFirebaseWebConfig() {
  return {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',
    messagingSenderId: '',
    storageBucket: '',
  };
}

/** Start SMS via Play Integrity / native Firebase (verifier argument ignored). */
export async function startFirebasePhoneOtp(
  phoneE164: string,
  _applicationVerifier: unknown,
  { forceResend = false }: { forceResend?: boolean } = {}
): Promise<string> {
  requireNative();
  return startNativePhoneOtp(phoneE164, forceResend);
}

export async function confirmFirebasePhoneOtp(
  verificationId: string,
  code: string
): Promise<string> {
  requireNative();
  return confirmNativePhoneOtp(verificationId, code);
}

export function getFirebaseVerifiedPhone(): string | null {
  if (!nativePhoneAuthAvailable()) return null;
  return getNativeVerifiedPhone();
}

export async function getFreshIdToken(): Promise<string | null> {
  if (!nativePhoneAuthAvailable()) return null;
  return getNativeFreshIdToken();
}

export async function signOutFirebase(): Promise<void> {
  if (!nativePhoneAuthAvailable()) return;
  await signOutNative();
}
