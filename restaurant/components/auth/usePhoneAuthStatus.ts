import { useCallback, useEffect, useState } from 'react';

import {
  FIREBASE_NOT_CONFIGURED_COPY,
  formatAuthError,
} from '@/lib/auth/auth-error-copy';
import { FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE } from '@/lib/auth/firebase-errors';
import { isFirebasePhoneConfigured } from '@/lib/auth/firebase-phone';
import { phoneAuthApi } from '@/lib/auth/phone-auth-api';
import type { PhoneAuthStatus } from '@/lib/auth/types';
import { getApiErrorCode } from '@/lib/errors';

export type PhoneAuthAvailability = {
  loading: boolean;
  status: PhoneAuthStatus | null;
  /** Blocking reason (client keys blank or server Firebase missing). */
  unavailable: string | null;
  /** Non-blocking load error — sending is still allowed; the API will answer. */
  loadError: string | null;
  retry: () => void;
};

/** GET /auth/phone/status + client EXPO_PUBLIC_FIREBASE_* check. */
export function usePhoneAuthStatus(): PhoneAuthAvailability {
  const clientReady = isFirebasePhoneConfigured();
  const [loading, setLoading] = useState(clientReady);
  const [status, setStatus] = useState<PhoneAuthStatus | null>(null);
  const [serverMissing, setServerMissing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!clientReady) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    phoneAuthApi
      .status()
      .then((next) => {
        if (cancelled) return;
        setStatus(next);
        setServerMissing(!next.firebaseConfigured);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (getApiErrorCode(err) === 'FIREBASE_NOT_CONFIGURED') {
          setServerMissing(true);
          return;
        }
        setLoadError(formatAuthError(err, 'Could not check phone OTP availability.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clientReady, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const unavailable = !clientReady
    ? FIREBASE_CLIENT_NOT_CONFIGURED_MESSAGE
    : serverMissing
      ? FIREBASE_NOT_CONFIGURED_COPY
      : null;

  return { loading, status, unavailable, loadError, retry };
}
