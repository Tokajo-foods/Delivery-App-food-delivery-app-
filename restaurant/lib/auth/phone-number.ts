const E164_RE = /^\+[1-9]\d{7,14}$/;
const INDIA_MOBILE_RE = /^[6-9]\d{9}$/;

/**
 * India-first phone normaliser: 10-digit mobile (6-9…), 0-prefixed, 91-prefixed,
 * or any full E.164 number → E.164. Returns null when it cannot be valid.
 */
export function toE164Phone(raw: string): string | null {
  const value = raw.trim().replace(/[\s()-]/g, '');
  if (!value) return null;

  if (value.startsWith('+')) {
    if (!E164_RE.test(value)) return null;
    if (value.startsWith('+91') && !INDIA_MOBILE_RE.test(value.slice(3))) {
      return null;
    }
    return value;
  }

  const digits = value.replace(/\D/g, '');
  if (digits !== value) return null;
  if (INDIA_MOBILE_RE.test(digits)) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0') && INDIA_MOBILE_RE.test(digits.slice(1))) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91') && INDIA_MOBILE_RE.test(digits.slice(2))) {
    return `+${digits}`;
  }
  return null;
}

/** +919876543210 → +91 98•••••210 */
export function maskPhone(e164: string): string {
  if (e164.length < 8) return e164;
  const cc = e164.slice(0, 3);
  const rest = e164.slice(3);
  return `${cc} ${rest.slice(0, 2)}${'•'.repeat(Math.max(1, rest.length - 5))}${rest.slice(-3)}`;
}
