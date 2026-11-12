import { useCallback, useEffect, useState } from 'react';

import { isValidSignupEmail } from '@/components/auth/signup-validators';
import { useOtpCountdown } from '@/components/auth/useOtpCountdown';
import { authApi } from '@/lib/auth/api';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { getApiErrorCode } from '@/lib/errors';
import type { PartnerRole } from '@/lib/auth/types';

function normalizeSignupEmail(emailRaw: string): string {
  return emailRaw.trim().toLowerCase();
}

/** Register email OTP — shown whenever a new email is entered; enforced when server policy requires it. */
export function useSignupEmailOtp(role: PartnerRole) {
  const cooldown = useOtpCountdown();
  /** Default true until policy loads (partner signup expects email proof). */
  const [requireEmailOtp, setRequireEmailOtp] = useState(true);
  const [policyReady, setPolicyReady] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const policy = await authApi.getRegisterPolicy();
        if (active) {
          setRequireEmailOtp(Boolean(policy.requireEmailOtp));
          setPolicyReady(true);
        }
      } catch {
        if (active) {
          setRequireEmailOtp(true);
          setPolicyReady(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const isVerifiedEmail = useCallback(
    (emailRaw: string) => {
      const email = normalizeSignupEmail(emailRaw);
      return Boolean(email && verifiedEmail === email);
    },
    [verifiedEmail]
  );

  /** Show send-code UI after a valid new email is typed. */
  const shouldShowVerify = useCallback(
    (emailRaw: string) => {
      const email = normalizeSignupEmail(emailRaw);
      if (!email || !isValidSignupEmail(email)) return false;
      return !isVerifiedEmail(emailRaw);
    },
    [isVerifiedEmail]
  );

  /** Block submit until OTP is confirmed when server requires it. */
  const needsVerify = useCallback(
    (emailRaw: string) => {
      const email = normalizeSignupEmail(emailRaw);
      if (!email || !isValidSignupEmail(email)) return false;
      if (isVerifiedEmail(emailRaw)) return false;
      if (policyReady && !requireEmailOtp) return false;
      return true;
    },
    [isVerifiedEmail, policyReady, requireEmailOtp]
  );

  const onEmailEdited = useCallback((emailRaw: string) => {
    const email = emailRaw.trim().toLowerCase();
    if (!email || (verifiedEmail && verifiedEmail !== email)) {
      setVerifiedEmail(null);
      setSentTo(null);
      setEmailOtp('');
      setVerifyError(null);
    }
  }, [verifiedEmail]);

  const sendCode = async (emailRaw: string) => {
    const email = emailRaw.trim().toLowerCase();
    if (!email || sending) return;
    setSendError(null);
    setVerifyError(null);
    setSending(true);
    try {
      const result = await authApi.sendOtp({
        emailOrPhone: email,
        purpose: 'register',
        role,
      });
      cooldown.start(result.cooldownSeconds);
      setSentTo(email);
      setEmailOtp('');
    } catch (err) {
      setSendError(formatAuthError(err, 'Could not send email code.'));
    } finally {
      setSending(false);
    }
  };

  const confirmCode = async (emailRaw: string, otp?: string) => {
    const email = emailRaw.trim().toLowerCase();
    const code = (otp ?? emailOtp).trim();
    if (!email || code.length !== 6 || confirming) return false;
    setVerifyError(null);
    setConfirming(true);
    try {
      await authApi.confirmRegisterOtp({
        emailOrPhone: email,
        otp: code,
        role,
      });
      setVerifiedEmail(email);
      return true;
    } catch (err) {
      const codeErr = getApiErrorCode(err);
      setVerifyError(
        formatAuthError(
          err,
          codeErr === 'INVALID_OTP' ? 'That code is wrong. Try again.' : 'Could not verify email.'
        )
      );
      return false;
    } finally {
      setConfirming(false);
    }
  };

  return {
    requireEmailOtp,
    policyReady,
    shouldShowVerify,
    needsVerify,
    isVerifiedEmail,
    verifiedEmail,
    emailOtp,
    setEmailOtp,
    sendError,
    verifyError,
    sending,
    confirming,
    sentTo,
    cooldownSeconds: cooldown.seconds,
    cooldownActive: cooldown.active,
    onEmailEdited,
    sendCode,
    confirmCode,
  };
}

export type SignupEmailOtp = ReturnType<typeof useSignupEmailOtp>;
