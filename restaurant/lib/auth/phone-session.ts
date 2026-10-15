import { lockedPartnerRole, wrongAppMessage } from '@/lib/app-variant';
import { authApi } from '@/lib/auth/api';
import { signOutFirebase } from '@/lib/auth/firebase-phone';
import type { PartnerRole, PhoneAuthResult } from '@/lib/auth/types';
import { clearApiSession } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

/**
 * Persist a `/auth/phone/*` session exactly like password login does
 * (SecureStore + auth store), using the portal role the user asked for.
 */
export async function applyPhoneAuthSession(
  result: PhoneAuthResult,
  role: PartnerRole
): Promise<void> {
  const locked = lockedPartnerRole();
  if (locked && role !== locked) {
    await authApi.logout().catch(() => undefined);
    await clearApiSession();
    throw new Error(wrongAppMessage(locked));
  }
  await useAuthStore.getState().setSession(result.token, { ...result.user, role });
  await signOutFirebase();
}
