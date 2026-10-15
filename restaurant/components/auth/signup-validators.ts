const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{1,14}$/;
const NAME_RE = /^[a-zA-Z\s'-]+$/;

export function isValidSignupEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidSignupPhone(value: string): boolean {
  return E164_RE.test(value.trim());
}

/** Mirrors user-service password rule: 8-128, upper, lower, digit, special. */
export function isStrongSignupPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    value.length <= 128 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export const PASSWORD_RULE_COPY =
  '8-128 chars with upper, lower, digit, and special character';

export function isSixDigitOtp(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

/** First name: 2-50 letters, spaces, apostrophes, hyphens. */
export function isValidFirstName(value: string): boolean {
  const v = value.trim();
  return v.length >= 2 && v.length <= 50 && NAME_RE.test(v);
}

export function isValidOptionalLastName(value: string): boolean {
  const v = value.trim();
  return !v || (v.length <= 50 && NAME_RE.test(v));
}
