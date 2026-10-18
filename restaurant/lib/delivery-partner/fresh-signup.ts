type FreshRiderSignup = { inviteToken?: string };

let pending: FreshRiderSignup | null = null;

/** Set right before the new rider session is applied, so setup opens the profile form directly. */
export function markFreshRiderSignup(inviteToken?: string) {
  pending = { inviteToken: inviteToken?.trim() || undefined };
}

export function peekFreshRiderSignup(): FreshRiderSignup | null {
  return pending;
}

/** After the rider profile is created. */
export function clearFreshRiderSignup() {
  pending = null;
}
