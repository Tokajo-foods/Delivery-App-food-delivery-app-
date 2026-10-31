import { Platform } from 'react-native';

type NativeAuthModule = typeof import('@react-native-firebase/auth');

/** Returned by `startNativePhoneOtp` when Android verified the number without an SMS code. */
export const NATIVE_AUTO_VERIFIED = '__native_auto_verified__';

let nativeModule: NativeAuthModule | null | undefined;

/** RNFB is only usable in builds that linked it and found google-services config. */
function loadNative(): NativeAuthModule | null {
  if (nativeModule !== undefined) return nativeModule;
  nativeModule = null;
  if (Platform.OS === 'web') return nativeModule;
  try {
    const { getApps } = require('@react-native-firebase/app') as typeof import('@react-native-firebase/app');
    if (getApps().length > 0) {
      nativeModule = require('@react-native-firebase/auth') as NativeAuthModule;
    }
  } catch {
    nativeModule = null;
  }
  return nativeModule;
}

/** Native phone auth (Play Integrity) — no in-app reCAPTCHA. */
export function nativePhoneAuthAvailable(): boolean {
  return loadNative() !== null;
}

function native() {
  const m = loadNative();
  if (!m) {
    throw Object.assign(new Error('Native Firebase is not available in this build.'), {
      code: 'PHONE_OTP_CLIENT_NOT_CONFIGURED',
    });
  }
  return { m, auth: m.getAuth() };
}

/** Sends the SMS. Resolves a verificationId, or `NATIVE_AUTO_VERIFIED` when Android auto-signed in. */
export async function startNativePhoneOtp(phoneE164: string, forceResend: boolean): Promise<string> {
  const { m, auth } = native();
  if (auth.currentUser) await m.signOut(auth);
  const result = await m.signInWithPhoneNumber(auth, phoneE164, undefined, forceResend);
  if (auth.currentUser?.phoneNumber === phoneE164) return NATIVE_AUTO_VERIFIED;
  if (!result.verificationId) {
    throw Object.assign(new Error('No verification id'), { code: 'auth/missing-verification-id' });
  }
  return result.verificationId;
}

export async function confirmNativePhoneOtp(verificationId: string, code: string): Promise<string> {
  const { m, auth } = native();
  const credential = m.PhoneAuthProvider.credential(verificationId, code);
  const result = await m.signInWithCredential(auth, credential);
  return result.user.getIdToken(true);
}

export function getNativeVerifiedPhone(): string | null {
  return loadNative()?.getAuth().currentUser?.phoneNumber ?? null;
}

export async function getNativeFreshIdToken(): Promise<string | null> {
  const user = loadNative()?.getAuth().currentUser;
  return user ? user.getIdToken(true) : null;
}

export async function signOutNative(): Promise<void> {
  const m = loadNative();
  const auth = m?.getAuth();
  if (!m || !auth?.currentUser) return;
  try {
    await m.signOut(auth);
  } catch {
    // Local Firebase state only; backend session is authoritative.
  }
}

/** Android can auto-retrieve the SMS after the code screen shows; fires once that number signs in. */
export function watchNativePhoneSignIn(phoneE164: string, onVerified: () => void): () => void {
  const m = loadNative();
  if (!m) return () => {};
  return m.onAuthStateChanged(m.getAuth(), (user) => {
    if (user?.phoneNumber === phoneE164) onVerified();
  });
}
