export type ContactKind = 'phone' | 'email';
export type ContactChangeStep =
  | 'current_otp'
  | 'enter_new'
  | 'new_otp'
  | 'success';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (value.trim().startsWith('+')) return value.trim();
  return digits ? `+${digits}` : value.trim();
}

export function isValidContactEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim().toLowerCase());
}

export function contactChangeTitle(
  kind: ContactKind,
  step: ContactChangeStep
): string {
  if (step === 'success') {
    return kind === 'phone' ? 'Phone updated' : 'Email updated';
  }
  return kind === 'phone' ? 'Change phone number' : 'Change email';
}

export function contactChangeHint(
  kind: ContactKind,
  step: ContactChangeStep,
  masked: string
): string {
  const isPhone = kind === 'phone';
  if (step === 'current_otp') {
    return `We sent a code to ${masked || (isPhone ? 'your current phone' : 'your current email')}. Verify it before changing.`;
  }
  if (step === 'enter_new') {
    return `Enter your new ${isPhone ? 'phone number' : 'email'}. It must not already be registered.`;
  }
  return `Enter the code sent to ${masked || 'your new contact'}.`;
}

export function contactChangeSuccessBody(kind: ContactKind): string {
  return kind === 'phone'
    ? 'Your phone number has been updated successfully. Use the new number for sign-in and OTP.'
    : 'Your email has been updated successfully. A confirmation was sent to the new address.';
}
