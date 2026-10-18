import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { phoneAuthApi, type PhoneCheckPurpose } from '@/lib/auth/phone-auth-api';
import type { PartnerRole } from '@/lib/auth/types';
import { getApiErrorCode } from '@/lib/errors';

export type PhonePrecheckMiss = { code?: string; message: string };

/** `POST /auth/phone/check` before Firebase sends an SMS. `null` means the OTP may be sent. */
export async function precheckPhone(
  phone: string,
  role: PartnerRole,
  purpose: PhoneCheckPurpose
): Promise<PhonePrecheckMiss | null> {
  try {
    await phoneAuthApi.check(phone, role, purpose);
    return null;
  } catch (err) {
    return {
      code: getApiErrorCode(err) ?? undefined,
      message: formatAuthError(err, 'Could not check this number. Try again.'),
    };
  }
}
