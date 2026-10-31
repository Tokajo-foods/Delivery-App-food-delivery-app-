import { formatAuthError } from '@/lib/auth/auth-error-copy';

export const FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE =
  'Phone OTP is not configured in this build. Add the EXPO_PUBLIC_FIREBASE_* keys and restart Expo.';

const FIREBASE_COPY: Record<string, string> = {
  'auth/invalid-phone-number': 'That phone number is not valid. Check it and try again.',
  'auth/missing-phone-number': 'Enter your mobile number first.',
  'auth/too-many-requests':
    'Too many OTP attempts from this device. Wait a while before trying again.',
  'auth/quota-exceeded': 'SMS limit reached for now. Try again later.',
  'auth/invalid-verification-code': 'That OTP is wrong. Check the SMS and try again.',
  'auth/missing-verification-code': 'Enter the 6-digit OTP from the SMS.',
  'auth/code-expired': 'This OTP expired. Request a new one.',
  'auth/session-expired': 'This OTP expired. Request a new one.',
  'auth/invalid-verification-id': 'OTP session expired. Request a new OTP.',
  'auth/missing-verification-id': 'OTP session expired. Request a new OTP.',
  'auth/network-request-failed':
    'Network error while talking to Firebase. Check your internet and try again.',
  'auth/timeout': 'Sending the OTP took too long. Check your internet and try again.',
  'auth/captcha-check-failed': 'Security check failed. Request the OTP again.',
  'auth/invalid-app-credential': 'Security check failed. Request the OTP again.',
  'auth/missing-app-credential': 'Security check failed. Request the OTP again.',
  'auth/operation-not-allowed':
    'Phone sign-in is disabled in Firebase. Ask ops to enable the Phone provider.',
  'auth/app-not-authorized':
    'This app is not authorised for Firebase phone sign-in. Ask ops to check the Firebase project.',
  'auth/missing-client-identifier':
    'This app version is not registered for phone sign-in yet. Ask ops to add its SHA-256 in Firebase.',
  'auth/unauthorized-domain':
    'This build’s domain is not authorised in Firebase. Ask ops to add it under Authorized domains.',
  'auth/invalid-api-key': FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE,
  ERR_FIREBASE_RECAPTCHA_CANCEL: 'Verification cancelled. Tap Send OTP to try again.',
  ERR_FIREBASE_RECAPTCHA_ERROR: 'Could not load the security check. Check your connection.',
  ERR_FIREBASE_RECAPTCHA_CONFIG: FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE,
  FIREBASE_CLIENT_NOT_CONFIGURED: FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE,
};

/** Codes where the current verification id is dead and a new SMS is required. */
export const FIREBASE_RESEND_REQUIRED_CODES = new Set([
  'auth/code-expired',
  'auth/session-expired',
  'auth/invalid-verification-id',
  'auth/missing-verification-id',
  'auth/captcha-check-failed',
  'auth/invalid-app-credential',
]);

export function getFirebaseErrorCode(error: unknown): string | undefined {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

export function describeFirebaseError(error: unknown, fallback: string): string {
  const code = getFirebaseErrorCode(error);
  if (code && FIREBASE_COPY[code]) return FIREBASE_COPY[code];
  if (error instanceof Error && /cancel/i.test(error.message)) {
    return FIREBASE_COPY.ERR_FIREBASE_RECAPTCHA_CANCEL;
  }
  return fallback;
}

export function isWrongOtpError(error: unknown): boolean {
  return getFirebaseErrorCode(error) === 'auth/invalid-verification-code';
}

export function requiresNewOtp(error: unknown): boolean {
  const code = getFirebaseErrorCode(error);
  return code ? FIREBASE_RESEND_REQUIRED_CODES.has(code) : false;
}

/** @deprecated Prefer describeFirebaseError */
export function firebasePhoneErrorMessage(error: unknown, fallback: string): string {
  return describeFirebaseError(error, fallback);
}
