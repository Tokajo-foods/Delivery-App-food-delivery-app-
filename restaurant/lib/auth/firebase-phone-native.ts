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
      code: 'FIREBASE_CLIENT_NOT_CONFIGURED',
    });
  }
  return { m, auth: m.getAuth() };
}

/** Long timeout so slow networks / Play Integrity checks can finish before we fail. */
const SEND_TIMEOUT_MS = 120_000;
/** Instant verification signs in natively; the JS auth state can trail the send promise. */
const AUTO_SIGN_IN_WAIT_MS = 5_000;

function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error('Sending the OTP timed out'), { code: 'auth/timeout' })),
      ms
    );
    task.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function waitForPhoneUser(m: NativeAuthModule, phoneE164: string, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    let unsubscribe: (() => void) | null = null;
    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      unsubscribe?.();
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), ms);
    unsubscribe = m.onAuthStateChanged(m.getAuth(), (user) => {
      if (user?.phoneNumber === phoneE164) finish(true);
    });
    if (done) unsubscribe();
  });
}

/** Sends the SMS. Resolves a verificationId, or `NATIVE_AUTO_VERIFIED` when Android auto-signed in. */
export async function startNativePhoneOtp(phoneE164: string, forceResend: boolean): Promise<string> {
  const { m, auth } = native();
  if (auth.currentUser) await m.signOut(auth);
  // RNFB's modular wrapper forwards its 3rd argument as the native `forceResend` flag on Android.
  const send = m.signInWithPhoneNumber(auth, phoneE164, forceResend as never);
  const result = await withTimeout(send, SEND_TIMEOUT_MS);
  if (auth.currentUser?.phoneNumber === phoneE164) return NATIVE_AUTO_VERIFIED;
  if (result.verificationId) return result.verificationId;
  if (await waitForPhoneUser(m, phoneE164, AUTO_SIGN_IN_WAIT_MS)) return NATIVE_AUTO_VERIFIED;
  throw Object.assign(new Error('No verification id'), { code: 'auth/missing-verification-id' });
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
