import { storageDeleteItem, storageGetItem, storageSetItem } from '@/lib/storage';

const BY_USER_PREFIX = 'partner_signup_name_user_';
const BY_PHONE_PREFIX = 'partner_signup_name_phone_';

export type PartnerSignupNameRecord = {
  firstName: string;
  lastName?: string;
};

function normalizePhone(phone?: string | null): string {
  return (phone ?? '').replace(/\D/g, '');
}

export async function savePartnerSignupNameDraft(
  phone: string | undefined,
  record: PartnerSignupNameRecord,
): Promise<void> {
  const firstName = record.firstName.trim();
  if (firstName.length < 2) return;
  const keyPhone = normalizePhone(phone);
  const payload = JSON.stringify({
    firstName,
    lastName: record.lastName?.trim() || undefined,
  });
  if (keyPhone) {
    await storageSetItem(`${BY_PHONE_PREFIX}${keyPhone}`, payload);
  }
}

export async function bindPartnerSignupNameToUser(
  userId: string,
  phone: string | undefined,
  record: PartnerSignupNameRecord,
): Promise<void> {
  const firstName = record.firstName.trim();
  if (!userId || firstName.length < 2) return;
  await storageSetItem(
    `${BY_USER_PREFIX}${userId}`,
    JSON.stringify({
      firstName,
      lastName: record.lastName?.trim() || undefined,
    }),
  );
  const keyPhone = normalizePhone(phone);
  if (keyPhone) {
    await storageSetItem(
      `${BY_PHONE_PREFIX}${keyPhone}`,
      JSON.stringify({
        firstName,
        lastName: record.lastName?.trim() || undefined,
      }),
    );
  }
}

export async function loadPartnerSignupName(
  userId?: string | null,
  phone?: string | null,
): Promise<PartnerSignupNameRecord | null> {
  const tryParse = (raw: string | null): PartnerSignupNameRecord | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as PartnerSignupNameRecord;
      const firstName = parsed.firstName?.trim();
      if (!firstName || firstName.length < 2) return null;
      return {
        firstName,
        lastName: parsed.lastName?.trim() || undefined,
      };
    } catch {
      return null;
    }
  };

  if (userId) {
    const byUser = tryParse(await storageGetItem(`${BY_USER_PREFIX}${userId}`));
    if (byUser) return byUser;
  }
  const keyPhone = normalizePhone(phone);
  if (keyPhone) {
    return tryParse(await storageGetItem(`${BY_PHONE_PREFIX}${keyPhone}`));
  }
  return null;
}

export async function clearPartnerSignupNameForUser(userId: string): Promise<void> {
  await storageDeleteItem(`${BY_USER_PREFIX}${userId}`);
}
