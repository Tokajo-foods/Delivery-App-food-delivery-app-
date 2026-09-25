const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_RE = /^\+[1-9]\d{1,14}$/;

export function isValidSignupEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isValidSignupPhone(value: string): boolean {
  return E164_RE.test(value.trim());
}

export function isStrongSignupPassword(value: string): boolean {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export function isSixDigitOtp(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}
