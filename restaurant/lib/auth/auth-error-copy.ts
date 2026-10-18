import { getApiErrorCode, getApiErrorMessage } from '@/lib/errors';

export const FIREBASE_NOT_CONFIGURED_COPY =
  'Phone OTP is not available yet — server Firebase credentials are missing.';

export const AUTH_ERROR_COPY: Record<string, string> = {
  OTP_COOLDOWN: 'Wait a few seconds before requesting another code.',
  OTP_RATE_LIMITED: 'Too many OTP requests. Try again in 15 minutes.',
  OTP_EXPIRED: 'That code expired. Request a new one.',
  SMS_UNAVAILABLE:
    'SMS is temporarily unavailable. Use email OTP or password sign-in.',
  EMAIL_NOT_VERIFIED: 'Verify your email OTP before creating an account.',
  PHONE_NOT_VERIFIED: 'Verify your phone OTP before creating an account.',
  OTP_CHANNEL_DISABLED:
    'This signup OTP channel is disabled on the server right now.',
  EMAIL_UNAVAILABLE:
    'Email OTP could not be sent. Ask ops to configure SENDER_EMAIL / SENDER_PASSWORD.',
  FIREBASE_NOT_CONFIGURED: FIREBASE_NOT_CONFIGURED_COPY,
  FIREBASE_UNAVAILABLE:
    'Phone verification is temporarily unavailable. Try again later.',
  FIREBASE_TOKEN_INVALID: 'Phone verification failed. Request a new OTP and try again.',
  FIREBASE_TOKEN_EXPIRED:
    'Your phone verification is older than 10 minutes. Resend the OTP and verify again.',
  PHONE_OTP_CLIENT_NOT_CONFIGURED: 'Phone OTP is not configured in this build.',
  PHONE_ALREADY_REGISTERED:
    'This number already has an account for this app. Sign in with OTP instead.',
  PHONE_MISMATCH:
    'The verified number does not match the number entered. Verify the number again.',
  ROLE_NOT_ALLOWED:
    'This number has a Tokajo account, but not for this app yet. Register it for this role first.',
  RESET_TOKEN_INVALID:
    'This reset session expired. Verify your phone again to set a new password.',
  RATE_LIMITED: 'Too many attempts. Wait a few minutes and try again.',
  CONTACT_REQUIRED: 'Email and phone are required for partner signup.',
  SOCIAL_TOKEN_INVALID: 'Social sign-in failed. Try again.',
  SOCIAL_ACCOUNT_CONFLICT:
    'This Google/Apple account is already linked to another user.',
  SOCIAL_AUTH_UNAVAILABLE: 'Social sign-in is temporarily unavailable.',
  ACCOUNT_SUSPENDED: 'Your account is suspended. Contact support.',
  ACCOUNT_BLOCKED: 'Your account is blocked. Contact support.',
  ACCOUNT_DEACTIVATED: 'This account is deactivated. Contact support.',
  INVALID_CREDENTIALS: 'Email or password is incorrect.',
  INVALID_OTP: 'That code is wrong or expired. Request a new one.',
  EMAIL_NOT_FOUND: 'No account found for that email.',
  USER_NOT_FOUND: 'No account found. Create one first.',
  ACCOUNT_NOT_FOUND:
    'This account does not exist in our system. Check the email or phone and try again.',
  EMAIL_ALREADY_EXISTS:
    'An account already exists with this email. Use another email or sign in.',
  PHONE_ALREADY_EXISTS:
    'This phone number is already registered to another account. Use a different phone number.',
  ACCOUNT_EXISTS:
    'This email already has a Tokajo account. Use that account’s password to add restaurant access, or sign in / reset password.',
  RESET_OTP_REQUIRED:
    'Verify the password-reset OTP before setting a new password.',
  FORGOT_OTP_USE_CONFIRM:
    'Confirm the reset OTP first, then set your new password.',
  CONTACT_CONFLICT:
    'This email and phone belong to two different accounts. Use one account’s email or phone.',
  ROLE_NOT_ON_ACCOUNT:
    'This login does not have restaurant/rider access yet. Complete signup for that role first.',
  TOKEN_EXPIRED: 'This link expired. Request a new one.',
  TOKEN_INVALID: 'This link is invalid. Request a new one.',
  CURRENT_PASSWORD_INVALID: 'Current password is incorrect.',
  CURRENT_CONTACT_UNVERIFIED: 'Verify your current number again before adding the new one.',
  SAME_CONTACT: 'That is already your phone number.',
  PHONE_IN_USE: 'This number is already registered with another account.',
  CONTACT_MISSING: 'Add an email or phone number to your account first.',
  EMAIL_OTP_REQUIRED: 'Enter the code sent to your email.',
  PHONE_OTP_REQUIRED: 'Verify the code sent to your phone.',
  OTP_ATTEMPTS_EXCEEDED: 'Too many wrong codes. Request a new email code.',
  CHANGE_TOKEN_INVALID: 'This session expired. Verify the codes again.',
  SAME_PASSWORD: 'Choose a password different from your current one.',
  PHONE_CHANGE_USE_FIREBASE: 'Update the app to change your phone number.',
  PASSWORD_CHANGE_USE_OTP: 'Update the app to change your password.',
  EMAIL_ALREADY_VERIFIED: 'Your email is already verified.',
};

export function formatAuthError(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  if (code && AUTH_ERROR_COPY[code]) return AUTH_ERROR_COPY[code];
  return getApiErrorMessage(error, fallback);
}
