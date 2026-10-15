import { formatAuthError } from '@/lib/auth/auth-error-copy';

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
  'auth/network-request-failed':
    'Network error while talking to Firebase. Check your internet and try again.',
  'auth/captcha-check-failed': 'Security check failed. Request the OTP again.',
  'auth/invalid-app-credential': 'Security check failed. Request the OTP again.',
  'auth/operation-not-allowed':
    'Phone sign-in is disabled in Firebase. Ask ops to enable the Phone provider.',
  'auth/app-not-authorized':
    'This app is not authorised for Firebase phone sign-in. Ask ops to check the Firebase project.',
  'auth/unauthorized-domain':
    'This build’s domain is not authorised in Firebase. Ask ops to add it under Authorized domains.',
  ERR_FIREBASE_RECAPTCHA_CANCEL: 'Security check was cancelled. Tap Send OTP to try again.',
};

/** Codes where the current verification id is dead and a new SMS is required. */
const RESEND_REQUIRED = new Set([
  'auth/code-expired',
  'auth/session-expired',
  'auth/captcha-check-failed',
  'auth/invalid-app-credential',
]);

function firebaseCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return '';
}

export function isRecaptchaCancelled(error: unknown): boolean {
  if (firebaseCode(error) === 'ERR_FIREBASE_RECAPTCHA_CANCEL') return true;
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return message.includes('cancelled by user') || message.includes('canceled by user');
}

export function isWrongOtpError(error: unknown): boolean {
  return firebaseCode(error) === 'auth/invalid-verification-code';
}

export function requiresNewOtp(error: unknown): boolean {
  return RESEND_REQUIRED.has(firebaseCode(error));
}

/** Firebase / reCAPTCHA / client-config error → owner-facing copy. */
export function firebasePhoneErrorMessage(error: unknown, fallback: string): string {
  if (isRecaptchaCancelled(error)) return FIREBASE_COPY.ERR_FIREBASE_RECAPTCHA_CANCEL;
  const code = firebaseCode(error);
  if (FIREBASE_COPY[code]) return FIREBASE_COPY[code];
  return formatAuthError(error, fallback);
}
