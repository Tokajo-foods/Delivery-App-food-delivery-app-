import { useState } from 'react';

import {
  EMPTY_SIGNUP_DETAILS,
  type SignupDetailErrors,
  type SignupDetails,
  validateSignupDetails,
} from '@/components/auth/PhoneSignupDetailsForm';
import { useFirebasePhoneOtp } from '@/components/auth/useFirebasePhoneOtp';
import { usePhoneAuthStatus } from '@/components/auth/usePhoneAuthStatus';
import { AUTH_ERROR_COPY, formatAuthError } from '@/lib/auth/auth-error-copy';
import { isAuthApiError } from '@/lib/auth/http';
import { phoneAuthApi } from '@/lib/auth/phone-auth-api';
import { precheckPhone } from '@/lib/auth/phone-precheck';
import type { PartnerRole, PhoneAuthResult } from '@/lib/auth/types';
import { getApiErrorCode } from '@/lib/errors';

const RESTART_CODES = new Set([
  'FIREBASE_TOKEN_EXPIRED',
  'FIREBASE_TOKEN_INVALID',
  'PHONE_MISMATCH',
]);

const DETAIL_FIELDS = new Set<keyof SignupDetails>([
  'firstName',
  'lastName',
  'email',
  'password',
]);

type Options = {
  role: PartnerRole;
  initialPhone?: string;
  initialDetails?: Partial<SignupDetails>;
};

/** Phone OTP → details → POST /auth/phone/register (fresh ID token at submit). */
export function usePhoneSignup({ role, initialPhone, initialDetails }: Options) {
  const availability = usePhoneAuthStatus();
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const otp = useFirebasePhoneOtp({
    initialPhone,
    cooldownSeconds: availability.status?.resendCooldownSeconds,
    precheck: async (phone) => {
      setAlreadyRegistered(false);
      const miss = await precheckPhone(phone, role, 'register');
      if (!miss) return null;
      setAlreadyRegistered(miss.code === 'PHONE_ALREADY_REGISTERED');
      return miss.message;
    },
  });
  const [step, setStep] = useState<'phone' | 'details'>(
    otp.stage === 'verified' ? 'details' : 'phone'
  );
  const [details, setDetails] = useState<SignupDetails>({
    ...EMPTY_SIGNUP_DETAILS,
    ...initialDetails,
  });
  const [fieldErrors, setFieldErrors] = useState<SignupDetailErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const patchDetails = (patch: Partial<SignupDetails>) =>
    setDetails((prev) => ({ ...prev, ...patch }));

  const verifyPhone = async (code?: string) => {
    setError(null);
    const verified = await otp.verify(code);
    if (verified) setStep('details');
  };

  const changeNumber = () => {
    otp.changeNumber();
    setAlreadyRegistered(false);
    setError(null);
    setStep('phone');
  };

  const applyServerErrors = (err: unknown) => {
    const code = getApiErrorCode(err);
    if (code && RESTART_CODES.has(code)) {
      otp.restart(formatAuthError(err, 'Verify your phone again.'));
      setStep('phone');
      return;
    }
    if (code === 'PHONE_ALREADY_REGISTERED') {
      setAlreadyRegistered(true);
      setError(AUTH_ERROR_COPY.PHONE_ALREADY_REGISTERED);
      return;
    }
    if (code === 'EMAIL_ALREADY_EXISTS') {
      setFieldErrors({ email: AUTH_ERROR_COPY.EMAIL_ALREADY_EXISTS });
      return;
    }
    if (isAuthApiError(err) && err.fieldErrors) {
      const mapped: SignupDetailErrors = {};
      for (const [field, messages] of Object.entries(err.fieldErrors)) {
        if (DETAIL_FIELDS.has(field as keyof SignupDetails) && messages[0]) {
          mapped[field as keyof SignupDetails] = messages[0];
        }
      }
      setFieldErrors(mapped);
    }
    setError(formatAuthError(err, 'Could not create your account.'));
  };

  const submit = async (): Promise<PhoneAuthResult | null> => {
    if (submitting) return null;
    setError(null);
    setAlreadyRegistered(false);
    const errs = validateSignupDetails(details);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return null;

    const verified = await otp.obtainIdToken();
    if (!verified) {
      setStep('phone');
      return null;
    }

    setSubmitting(true);
    try {
      return await phoneAuthApi.register({
        idToken: verified.idToken,
        role,
        phone: verified.phone,
        firstName: details.firstName.trim(),
        lastName: details.lastName.trim() || undefined,
        email: details.email.trim().toLowerCase() || undefined,
        password: details.password,
      });
    } catch (err) {
      applyServerErrors(err);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    availability,
    otp,
    step,
    details,
    patchDetails,
    fieldErrors,
    error,
    setError,
    alreadyRegistered,
    submitting,
    verifyPhone,
    changeNumber,
    submit,
  };
}

export type PhoneSignup = ReturnType<typeof usePhoneSignup>;
