import { requireOptionalNativeModule } from 'expo-modules-core';
import type { AuthRequest, AuthRequestPromptOptions, AuthSessionResult } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { formatAuthError } from '@/lib/auth/api';
import type { PartnerRole } from '@/lib/auth/types';
import { useAuthStore } from '@/store/auth-store';

WebBrowser.maybeCompleteAuthSession();

type Extra = {
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

type GoogleAuthModule = {
  useIdTokenAuthRequest: (config: {
    clientId: string;
    iosClientId?: string;
    androidClientId?: string;
    webClientId?: string;
  }) => [
    AuthRequest | null,
    AuthSessionResult | null,
    (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>,
  ];
};

/**
 * expo-auth-session Google provider imports expo-application at module load.
 * If the running binary has no ExpoApplication (Expo Go mismatch / stale APK),
 * requiring Google crashes the whole auth route — so probe first, then require.
 */
function loadGoogleAuth(): GoogleAuthModule | null {
  try {
    if (!requireOptionalNativeModule('ExpoApplication')) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-auth-session/providers/google') as GoogleAuthModule;
  } catch {
    return null;
  }
}

const Google = loadGoogleAuth();

function useGoogleIdTokenAuthRequestStub(): [
  AuthRequest | null,
  AuthSessionResult | null,
  (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>,
] {
  const prompt = useCallback(async () => ({ type: 'dismiss' as const }), []);
  return [null, null, prompt];
}

const useGoogleIdTokenAuthRequest =
  Google?.useIdTokenAuthRequest ?? useGoogleIdTokenAuthRequestStub;

function googleClientIds() {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  return {
    webClientId: extra.googleWebClientId?.trim() || undefined,
    iosClientId: extra.googleIosClientId?.trim() || undefined,
    androidClientId: extra.googleAndroidClientId?.trim() || undefined,
  };
}

export function isGoogleAuthConfigured() {
  return Boolean(googleClientIds().webClientId);
}

export function isGoogleNativeAvailable() {
  return Google != null;
}

type Options = {
  role: PartnerRole;
  onSuccess: () => Promise<void> | void;
  onError: (message: string) => void;
};

/**
 * Google (idToken) + Apple identity token → user-service social login.
 * Safe when ExpoApplication is missing — email/OTP login still works.
 */
export function useSocialSignIn({ role, onSuccess, onError }: Options) {
  const loginGoogle = useAuthStore((s) => s.loginGoogle);
  const loginApple = useAuthStore((s) => s.loginApple);
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const handledResponse = useRef<string | null>(null);
  const ids = googleClientIds();
  const googleNative = Google != null;

  const [request, response, promptAsync] = useGoogleIdTokenAuthRequest({
    clientId: ids.webClientId || 'unconfigured.apps.googleusercontent.com',
    iosClientId: ids.iosClientId,
    androidClientId: ids.androidClientId,
    webClientId: ids.webClientId,
  });

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (!response) return;
    const responseWithParams = response as AuthSessionResult & {
      params?: Record<string, unknown>;
    };
    const key = `${response.type}:${JSON.stringify(responseWithParams.params ?? {})}`;
    if (handledResponse.current === key) return;
    handledResponse.current = key;

    if (response.type !== 'success') {
      if (response.type === 'error') {
        onError(
          formatAuthError(
            response.error,
            'Google sign-in was cancelled or failed.'
          )
        );
      }
      setBusy(null);
      return;
    }

    const idTokenFromParams = responseWithParams.params?.id_token;
    const idToken =
      (typeof idTokenFromParams === 'string' ? idTokenFromParams : undefined) ||
      (response.authentication as { idToken?: string } | null)?.idToken;
    if (!idToken) {
      onError('Google did not return an ID token. Try again.');
      setBusy(null);
      return;
    }

    void (async () => {
      try {
        await loginGoogle({ idToken, role });
        await onSuccess();
      } catch (err) {
        onError(
          err instanceof Error
            ? err.message
            : formatAuthError(err, 'Google sign-in failed')
        );
      } finally {
        setBusy(null);
      }
    })();
  }, [loginGoogle, onError, onSuccess, response, role]);

  const signInWithGoogle = useCallback(async () => {
    if (!googleNative) {
      Alert.alert(
        'Google sign-in',
        'This install is missing the Google native module. Use email / OTP, or run a fresh native build:\nnpx expo run:android\n(or EAS development build), then npx expo start --dev-client'
      );
      return;
    }
    if (!ids.webClientId) {
      Alert.alert(
        'Google sign-in',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env (OAuth web client that user-service verifies) and restart Expo with npx expo start -c.'
      );
      return;
    }
    if (!request) {
      onError('Google sign-in is still loading. Try again in a moment.');
      return;
    }
    setBusy('google');
    try {
      const result = await promptAsync();
      if (result.type === 'dismiss' || result.type === 'cancel') {
        setBusy(null);
      }
    } catch (err) {
      setBusy(null);
      onError(
        err instanceof Error
          ? err.message
          : formatAuthError(err, 'Could not open Google sign-in.')
      );
    }
  }, [googleNative, ids.webClientId, onError, promptAsync, request]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios' || !appleAvailable) {
      Alert.alert(
        'Apple sign-in',
        'Sign in with Apple is available on iPhone and iPad. Use Google, OTP, or email on this device.'
      );
      return;
    }
    setBusy('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        throw new Error('Apple did not return an identity token.');
      }
      await loginApple({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode ?? undefined,
        firstName: credential.fullName?.givenName ?? undefined,
        lastName: credential.fullName?.familyName ?? undefined,
        email: credential.email ?? undefined,
        role,
      });
      await onSuccess();
    } catch (err) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      onError(
        err instanceof Error
          ? err.message
          : formatAuthError(err, 'Apple sign-in failed')
      );
    } finally {
      setBusy(null);
    }
  }, [appleAvailable, loginApple, onError, onSuccess, role]);

  return {
    signInWithGoogle,
    signInWithApple,
    busy,
    appleAvailable,
    googleReady: googleNative && Boolean(request),
    googleNative,
  };
}
