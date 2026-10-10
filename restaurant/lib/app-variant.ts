import type { PartnerRole } from '@/lib/auth/types';

export type AppVariant = 'combined' | 'restaurant' | 'delivery';

/** Unset means the current combined restaurant + rider app. */
export function getAppVariant(): AppVariant {
  const raw = process.env.EXPO_PUBLIC_APP_VARIANT?.trim().toLowerCase();
  if (raw === 'restaurant' || raw === 'delivery') return raw;
  return 'combined';
}

export function lockedPartnerRole(): PartnerRole | null {
  const variant = getAppVariant();
  if (variant === 'combined') return null;
  return variant;
}

export function wrongAppMessage(locked: PartnerRole): string {
  return locked === 'restaurant'
    ? 'This account opens in the TOKAJO Delivery app.'
    : 'This account opens in the TOKAJO Restaurant app.';
}
