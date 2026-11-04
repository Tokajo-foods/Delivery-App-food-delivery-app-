import { getApiErrorCode, getApiErrorMessage } from '@/lib/errors';

/** Rider-facing copy for profile / register / KYC upload error codes. */
export const PARTNER_ERROR_COPY: Record<string, string> = {
  PARTNER_NOT_FOUND: 'No rider profile is linked to this login yet.',
  PARTNER_EXISTS: 'A rider profile already exists for this login. Sign in to continue.',
  PARTNER_PHONE_TAKEN:
    'This phone number is already linked to another rider login. Sign in with that account instead.',
  PARTNER_EMAIL_TAKEN:
    'This email is already linked to another rider login. Sign in with that account instead.',
  INVALID_INVITE: 'This invitation link is invalid.',
  INVITE_NOT_FOUND: 'This invitation link is invalid or expired.',
  INVITE_EXPIRED: 'This invitation has expired. Ask the restaurant for a new one.',
  INVITE_NOT_PENDING: 'This invitation was already used or cancelled.',
  INVALID_REFERRAL_CODE: 'That referral code is not valid.',
  USE_BANK_API: 'Bank details are changed from the Payout section.',
  VEHICLE_TYPE_LOCKED:
    'Vehicle type is tied to your licence and RC. Contact support to change it.',
  INVALID_DOC_TYPE: 'This document type is not accepted.',
  DOC_TYPE_REQUIRED: 'Choose which document you are uploading.',
  NO_FILE: 'Select a photo of the document first.',
  DOCUMENT_VERIFIED: 'This document is already approved and locked.',
  DOCUMENT_UPLOAD_UNAVAILABLE: 'Could not store the document right now. Try again in a minute.',
  DOCUMENT_SAVE_FAILED: 'Could not save the document. Try again.',
  FILE_TOO_LARGE: 'The photo is larger than 5 MB. Choose a smaller photo.',
  INVALID_FILE_TYPE: 'Only JPG, PNG, WEBP photos or PDF files are accepted.',
  UNEXPECTED_FILE_FIELD: 'Upload failed. Update the app and try again.',
};

export function formatPartnerError(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error);
  if (code && PARTNER_ERROR_COPY[code]) return PARTNER_ERROR_COPY[code];
  return getApiErrorMessage(error, fallback);
}
