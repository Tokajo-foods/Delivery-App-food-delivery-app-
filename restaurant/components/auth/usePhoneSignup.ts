import { useEffect, useState } from 'react';

import { savePartnerSignupNameDraft } from '@/lib/auth/partner-signup-name-storage';

import {
  EMPTY_SIGNUP_DETAILS,
  type SignupDetailErrors,
  type SignupDetails,
  validateSignupDetails,
} from '@/components/auth/PhoneSignupDetailsForm';
import { useFirebasePhoneOtp } from '@/components/auth/useFirebasePhoneOtp';
import { useSignupEmailOtp } from '@/components/auth/useSignupEmailOtp';
import { usePhoneAuthStatus } from '@/components/auth/usePhoneAuthStatus';
import { AUTH_ERROR_COPY, formatAuthError } from '@/lib/auth/auth-error-copy';
import { isAuthApiError } from '@/lib/auth/http';
import { phoneAuthApi } from '@/lib/auth/phone-auth-api';
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
  const emailOtp = useSignupEmailOtp(role);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const otp = useFirebasePhoneOtp({
    initialPhone,
    cooldownSeconds: availability.status?.resendCooldownSeconds,
    precheck: async (phone) => {
      setAlreadyRegistered(false);
      try {
        await phoneAuthApi.check(phone, role, 'register');
        return null;
      } catch (err) {
        const code = getApiErrorCode(err) ?? undefined;
        if (code === 'ROLE_NOT_ALLOWED') return null;
        setAlreadyRegistered(code === 'PHONE_ALREADY_REGISTERED');
        return formatAuthError(err, 'Could not check this number. Try again.');
      }
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

  useEffect(() => {
    if (step !== 'details') return;
    const phone = otp.phone ?? otp.phoneInput;
    void savePartnerSignupNameDraft(phone, details);
  }, [details, otp.phone, otp.phoneInput, step]);

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
    if (code === 'CONTACT_CONFLICT') {
      setError(
        'That email or phone is already on another restaurant account. Use a different contact or sign in.'
      );
      return;
    }
    if (code === 'EMAIL_ALREADY_EXISTS' || code === 'EMAIL_MISMATCH') {
      setFieldErrors({
        email:
          code === 'EMAIL_MISMATCH'
            ? AUTH_ERROR_COPY.EMAIL_MISMATCH
            : AUTH_ERROR_COPY.EMAIL_ALREADY_EXISTS,
      });
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

    const email = details.email.trim().toLowerCase();
    if (emailOtp.needsVerify(email)) {
      setFieldErrors({
        email: AUTH_ERROR_COPY.EMAIL_NOT_VERIFIED,
      });
      setError('Verify your email with the code we send before creating your account.');
      return null;
    }

    const verified = await otp.obtainIdToken();
    if (!verified) {
      setStep('phone');
      return null;
    }

    await savePartnerSignupNameDraft(verified.phone, details);

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
    emailOtp,
  };
}

export type PhoneSignup = ReturnType<typeof usePhoneSignup>;
