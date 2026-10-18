import { useCallback, useEffect, useState } from 'react';

import { useOtpCountdown } from '@/components/auth/useOtpCountdown';
import type { PhoneOtpVerified } from '@/components/auth/useFirebasePhoneOtp';
import {
  passwordChangeApi,
  type PasswordChangeStart,
} from '@/lib/auth/account-security-api';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { signOutFirebase } from '@/lib/auth/firebase-phone';
import { AuthApiError } from '@/lib/auth/http';
import { getApiErrorCode } from '@/lib/errors';

export type PasswordChangeStage = 'loading' | 'verify' | 'password' | 'done';

const PASSWORD_RULES: [RegExp, string][] = [
  [/.{8,}/, 'Use at least 8 characters.'],
  [/[A-Z]/, 'Add an uppercase letter.'],
  [/[a-z]/, 'Add a lowercase letter.'],
  [/[0-9]/, 'Add a digit.'],
  [/[^A-Za-z0-9]/, 'Add a special character.'],
];

export function passwordRuleError(password: string): string | null {
  return PASSWORD_RULES.find(([re]) => !re.test(password))?.[1] ?? null;
}

/** start → email OTP + Firebase phone OTP → change token → new password → done. */
export function usePasswordChangeFlow() {
  const [stage, setStage] = useState<PasswordChangeStage>('loading');
  const [info, setInfo] = useState<PasswordChangeStart | null>(null);
  const [emailOtp, setEmailOtpState] = useState('');
  const [changeToken, setChangeToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cooldown = useOtpCountdown();

  const start = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const next = await passwordChangeApi.start();
      setInfo(next);
      if (next.emailOtpSent) cooldown.start(next.cooldownSeconds);
      setStage('verify');
    } catch (err) {
      if (getApiErrorCode(err) === 'OTP_COOLDOWN') cooldown.start(30);
      setError(formatAuthError(err, 'Could not start password change.'));
      setStage((s) => (s === 'loading' ? 'verify' : s));
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cooldown is stable per mount
  }, []);

  useEffect(() => {
    void start();
  }, [start]);

  const setEmailOtp = (value: string) => setEmailOtpState(value.replace(/\D/g, '').slice(0, 6));

  const emailReady = !info?.emailRequired || emailOtp.length === 6;

  const finishVerify = async (phoneIdToken?: string) => {
    const token = await passwordChangeApi.verify({
      emailOtp: info?.emailRequired ? emailOtp : undefined,
      phoneIdToken,
    });
    if (phoneIdToken) await signOutFirebase();
    setChangeToken(token);
    setError(null);
    setStage('password');
  };

  /** Phone card submit: thrown errors show inside the card. */
  const onPhoneVerified = async ({ idToken }: PhoneOtpVerified) => {
    if (!emailReady) throw new AuthApiError('Enter the 6-digit code from your email first.');
    await finishVerify(idToken);
  };

  /** Email-only accounts. */
  const verifyEmailOnly = async () => {
    if (!emailReady) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    try {
      await finishVerify();
    } catch (err) {
      setError(formatAuthError(err, 'Could not verify the code.'));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async (newPassword: string, confirmPassword: string) => {
    setError(null);
    const rule = passwordRuleError(newPassword);
    if (rule) return setError(rule);
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (!changeToken) return setStage('verify');
    setBusy(true);
    try {
      await passwordChangeApi.confirm(changeToken, newPassword);
      setStage('done');
    } catch (err) {
      if (getApiErrorCode(err) === 'CHANGE_TOKEN_INVALID') {
        setChangeToken(null);
        setEmailOtpState('');
        setStage('verify');
        void start();
      }
      setError(formatAuthError(err, 'Could not change password.'));
    } finally {
      setBusy(false);
    }
  };

  return {
    stage,
    info,
    emailOtp,
    setEmailOtp,
    emailReady,
    error,
    busy,
    cooldownSeconds: cooldown.seconds,
    resendEmail: start,
    onPhoneVerified,
    verifyEmailOnly,
    confirm,
  };
}

export type PasswordChangeFlow = ReturnType<typeof usePasswordChangeFlow>;
