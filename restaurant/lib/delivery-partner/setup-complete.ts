import type { DeliveryPartnerProfile } from '@/lib/delivery-partner/types';

/** True when POST /partners/register (wizard) has been submitted. */
export function isDeliveryPartnerProfileRegistered(
  profile: DeliveryPartnerProfile | null | undefined
): boolean {
  if (!profile?.id?.trim()) return false;
  return profile.profileRegistrationComplete !== false;
}
