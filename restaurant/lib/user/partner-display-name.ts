import type { AuthUser } from '@/lib/auth/types';

/** Greeting on kitchen/delivery home — partner account name, not restaurant outlet name. */
export function partnerGreetingName(
  user?: Pick<AuthUser, 'firstName' | 'lastName' | 'email' | 'partnerSignupNameRestaurant'> | null,
): string {
  const partner = user?.partnerSignupNameRestaurant?.trim();
  if (partner) return partner;
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  if (full) return full;
  const emailLocal = user?.email?.split('@')[0]?.trim();
  if (emailLocal) return emailLocal;
  return 'Partner';
}
