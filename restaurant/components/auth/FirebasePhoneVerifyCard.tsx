import { useState } from 'react';

import { PhoneOtpStep } from '@/components/auth/PhoneOtpStep';
import {
  useFirebasePhoneOtp,
  type PhoneOtpVerified,
} from '@/components/auth/useFirebasePhoneOtp';
import { usePhoneAuthStatus } from '@/components/auth/usePhoneAuthStatus';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { getApiErrorCode } from '@/lib/errors';

const RESTART_CODES = new Set(['FIREBASE_TOKEN_EXPIRED', 'FIREBASE_TOKEN_INVALID', 'PHONE_MISMATCH']);

type Props = {
  initialPhone?: string;
  lockPhone?: boolean;
  phoneLabel?: string;
  submitLabel: string;
  /** Called with a fresh Firebase ID token. Throw an API error to show it here. */
  onVerified: (verified: PhoneOtpVerified) => Promise<void>;
};

/** One Firebase phone check (always a fresh SMS). Mount with a new `key` for each number. */
export function FirebasePhoneVerifyCard({
  initialPhone,
  lockPhone,
  phoneLabel,
  submitLabel,
  onVerified,
}: Props) {
  const availability = usePhoneAuthStatus();
  const otp = useFirebasePhoneOtp({
    initialPhone,
    cooldownSeconds: availability.status?.resendCooldownSeconds,
    resume: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (code?: string) => {
    const verified = await otp.obtainIdToken(code);
    if (!verified) return;
    setSubmitting(true);
    try {
      await onVerified(verified);
    } catch (err) {
      const message = formatAuthError(err, 'Could not verify this number.');
      const errCode = getApiErrorCode(err);
      if (errCode && RESTART_CODES.has(errCode)) otp.restart(message);
      else otp.setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneOtpStep
      otp={otp}
      availability={availability}
      onSubmit={(code) => void submit(code)}
      submitLabel={submitLabel}
      submitting={submitting}
      phoneLabel={phoneLabel}
      lockPhone={lockPhone}
    />
  );
}
