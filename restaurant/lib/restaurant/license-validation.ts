import { FSSAI_RE, GSTIN_RE } from '@/lib/restaurant/onboarding-types';

/** Digits only, capped at 14 (Indian FSSAI license length). */
export function normalizeFssaiInput(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 14);
}

/** Uppercase, strip spaces; capped at 15 (GSTIN length). */
export function normalizeGstinInput(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase().slice(0, 15);
}

export function isValidFssai(value: string): boolean {
  return FSSAI_RE.test(value.trim());
}

export function isValidGstin(value: string): boolean {
  return GSTIN_RE.test(value.trim().toUpperCase());
}

/**
 * Optional fields: empty is OK. Partial / wrong length / bad format → message.
 * Returns null when the value may be submitted.
 */
export function fssaiValidationError(raw: string, options?: { required?: boolean }): string | null {
  const value = normalizeFssaiInput(raw);
  if (!value) {
    return options?.required ? 'FSSAI license number is required.' : null;
  }
  if (value.length < 14) {
    return `FSSAI must be exactly 14 digits (${value.length}/14 entered).`;
  }
  if (!isValidFssai(value)) {
    return 'Enter a valid FSSAI license number.';
  }
  return null;
}

export function gstinValidationError(raw: string): string | null {
  const value = normalizeGstinInput(raw);
  if (!value) return null;
  if (value.length < 15) {
    return `GSTIN must be exactly 15 characters (${value.length}/15 entered).`;
  }
  if (!isValidGstin(value)) {
    return 'Enter a valid GSTIN (e.g. 22AAAAA0000A1Z5).';
  }
  return null;
}
