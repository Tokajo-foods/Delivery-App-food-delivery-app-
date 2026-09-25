import Constants from 'expo-constants';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  PhoneAuthProvider,
  signInWithCredential,
  type Auth,
} from 'firebase/auth';

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

export function isFirebasePhoneConfigured(): boolean {
  const c = getFirebaseWebConfig();
  return Boolean(c.apiKey && c.projectId && c.appId && c.authDomain);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!isFirebasePhoneConfigured()) {
    throw new Error(
      'Firebase Phone Auth is not configured. Add EXPO_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, and APP_ID (Firebase Console → Project settings → Your apps → Web).'
    );
  }
  if (!app) {
    const config = getFirebaseWebConfig();
    app = getApps().length ? getApps()[0]! : initializeApp(config);
    auth = getAuth(app);
  }
  return auth!;
}

/**
 * Start Firebase phone OTP. `applicationVerifier` comes from FirebaseRecaptchaVerifierModal.
 */
export async function startFirebasePhoneOtp(
  phoneE164: string,
  applicationVerifier: { type: string; verify: () => Promise<string> }
): Promise<string> {
  const authInstance = getFirebaseAuth();
  const provider = new PhoneAuthProvider(authInstance);
  return provider.verifyPhoneNumber(phoneE164, applicationVerifier as never);
}

/** Confirm SMS code → Firebase ID token for POST /auth/otp/confirm-firebase-phone. */
export async function confirmFirebasePhoneOtp(
  verificationId: string,
  code: string
): Promise<string> {
  const authInstance = getFirebaseAuth();
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const result = await signInWithCredential(authInstance, credential);
  return result.user.getIdToken(true);
}
