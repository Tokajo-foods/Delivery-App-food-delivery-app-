import Constants from 'expo-constants';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  PhoneAuthProvider,
  signInWithCredential,
  signOut,
  type Auth,
} from 'firebase/auth';

import { FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE } from '@/lib/auth/firebase-errors';
import {
  confirmNativePhoneOtp,
  getNativeFreshIdToken,
  getNativeVerifiedPhone,
  nativePhoneAuthAvailable,
  signOutNative,
  startNativePhoneOtp,
} from '@/lib/auth/firebase-phone-native';

export { NATIVE_AUTO_VERIFIED, nativePhoneAuthAvailable } from '@/lib/auth/firebase-phone-native';

type Extra = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseAppId?: string;
  firebaseMessagingSenderId?: string;
  firebaseStorageBucket?: string;
};

/** Web client config from Expo extra / EXPO_PUBLIC_* (Firebase Console → Web app). */
export function getFirebaseWebConfig() {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  return {
    apiKey: extra.firebaseApiKey?.trim() || process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() || '',
    authDomain:
      extra.firebaseAuthDomain?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ||
      '',
    projectId:
      extra.firebaseProjectId?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
      '',
    appId: extra.firebaseAppId?.trim() || process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() || '',
    messagingSenderId:
      extra.firebaseMessagingSenderId?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
      '',
    storageBucket:
      extra.firebaseStorageBucket?.trim() ||
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
      '',
  };
}

function isWebConfigComplete(): boolean {
  const c = getFirebaseWebConfig();
  return Boolean(c.apiKey && c.projectId && c.appId && c.authDomain);
}

export function isFirebasePhoneConfigured(): boolean {
  return nativePhoneAuthAvailable() || isWebConfigComplete();
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!isWebConfigComplete()) {
    throw Object.assign(new Error(FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE), {
      code: 'FIREBASE_CLIENT_NOT_CONFIGURED',
    });
  }
  if (!app) {
    const config = getFirebaseWebConfig();
    app = getApps().length ? getApps()[0]! : initializeApp(config);
    auth = getAuth(app);
  }
  return auth!;
}

type WebVerifier = { type: string; verify: () => Promise<string> };

/**
 * Start Firebase phone OTP. Native builds skip reCAPTCHA (verifier unused) and may resolve
 * `NATIVE_AUTO_VERIFIED`; web/Expo Go need the FirebaseRecaptchaVerifierModal verifier.
 */
export async function startFirebasePhoneOtp(
  phoneE164: string,
  applicationVerifier: WebVerifier | null,
  { forceResend = false }: { forceResend?: boolean } = {},
): Promise<string> {
  if (nativePhoneAuthAvailable()) return startNativePhoneOtp(phoneE164, forceResend);
  if (!applicationVerifier) {
    throw Object.assign(new Error('Security check is still loading.'), {
      code: 'auth/missing-app-credential',
    });
  }
  const provider = new PhoneAuthProvider(getFirebaseAuth());
  return provider.verifyPhoneNumber(phoneE164, applicationVerifier as never);
}

export async function confirmFirebasePhoneOtp(
  verificationId: string,
  code: string,
): Promise<string> {
  if (nativePhoneAuthAvailable()) return confirmNativePhoneOtp(verificationId, code);
  const authInstance = getFirebaseAuth();
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const result = await signInWithCredential(authInstance, credential);
  return result.user.getIdToken(true);
}

/** E.164 phone of the Firebase user still signed in after OTP, if any. */
export function getFirebaseVerifiedPhone(): string | null {
  if (nativePhoneAuthAvailable()) return getNativeVerifiedPhone();
  if (!auth) return null;
  return auth.currentUser?.phoneNumber ?? null;
}

export async function getFreshIdToken(): Promise<string | null> {
  if (nativePhoneAuthAvailable()) return getNativeFreshIdToken();
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken(true);
}

export async function signOutFirebase(): Promise<void> {
  if (nativePhoneAuthAvailable()) return signOutNative();
  if (!auth?.currentUser) return;
  try {
    await signOut(auth);
  } catch {
    // local-only sign out; ignore
  }
}
