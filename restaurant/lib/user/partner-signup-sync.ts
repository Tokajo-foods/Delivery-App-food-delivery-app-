import {
  bindPartnerSignupNameToUser,
  loadPartnerSignupName,
  type PartnerSignupNameRecord,
} from '@/lib/auth/partner-signup-name-storage';
import { userAccountApi } from '@/lib/user/account-api';
import type { PlatformUser } from '@/lib/user/account-types';
import { useAuthStore } from '@/store/auth-store';

export function partnerSignupLabel(record: PartnerSignupNameRecord): string {
  return [record.firstName, record.lastName].filter(Boolean).join(' ').trim();
}

export function restaurantPartnerLabelFromMe(me?: PlatformUser | null): string | null {
  const raw = me?.partnerSignupNameRestaurant?.trim();
  return raw || null;
}

/** True when the server is missing or still has the wrong restaurant partner name. */
export function needsRestaurantPartnerNameSync(
  local: PartnerSignupNameRecord,
  me?: PlatformUser | null,
): boolean {
  const wanted = partnerSignupLabel(local).toLowerCase();
  if (!wanted) return false;
  const serverPartner = restaurantPartnerLabelFromMe(me)?.toLowerCase();
  return serverPartner !== wanted;
}

export async function syncRestaurantPartnerNameFromRecord(
  record: PartnerSignupNameRecord,
  userId: string,
  phone?: string,
): Promise<PlatformUser | null> {
  const firstName = record.firstName.trim();
  if (firstName.length < 2) return null;
  try {
    const updated = await userAccountApi.updateName({
      firstName,
      lastName: record.lastName?.trim(),
    });
    await useAuthStore.getState().patchUser({
      firstName: updated.firstName,
      lastName: updated.lastName,
      partnerSignupNameRestaurant: updated.partnerSignupNameRestaurant,
    });
    await bindPartnerSignupNameToUser(userId, phone, record);
    return updated;
  } catch {
    return null;
  }
}
