import type { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useRef, useState } from 'react';

import { useOtpCountdown } from '@/components/auth/useOtpCountdown';
import {
  firebasePhoneErrorMessage,
  isWrongOtpError,
  requiresNewOtp,
} from '@/lib/auth/firebase-errors';
import {
  confirmFirebasePhoneOtp,
  getFirebaseVerifiedPhone,
  getFreshIdToken,
  isFirebasePhoneConfigured,
  signOutFirebase,
  startFirebasePhoneOtp,
} from '@/lib/auth/firebase-phone';
import { maskPhone, toE164Phone } from '@/lib/auth/phone-number';

export const MAX_WRONG_OTP = 5;

export type PhoneOtpStage = 'phone' | 'code' | 'verified';
export type PhoneOtpVerified = { idToken: string; phone: string };

type Options = {
  initialPhone?: string;
  cooldownSeconds?: number;
  onSent?: (phone: string) => void;
};

function verifiedSessionFor(initialPhone?: string): string | null {
  const wanted = initialPhone ? toE164Phone(initialPhone) : null;
  if (!wanted) return null;
  try {
    return getFirebaseVerifiedPhone() === wanted ? wanted : null;
  } catch {
    return null;
  }
}

/** Firebase phone OTP state machine: phone → SMS code → verified ID token. */
export function useFirebasePhoneOtp(options: Options = {}) {
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const cooldown = useOtpCountdown();
  const [resumed] = useState(() => verifiedSessionFor(options.initialPhone));
  const [phoneInput, setPhoneInput] = useState(options.initialPhone ?? '');
  const [phone, setPhone] = useState<string | null>(resumed);
  const [stage, setStage] = useState<PhoneOtpStage>(resumed ? 'verified' : 'phone');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [code, setCodeState] = useState('');
  const [wrongCodes, setWrongCodes] = useState(0);
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const setCode = (value: string) => setCodeState(value.replace(/\D/g, '').slice(0, 6));

  const send = async () => {
    setError(null);
    setInfo(null);
    const e164 = toE164Phone(phoneInput);
    if (!e164) {
      setError('Enter a valid 10-digit mobile number (or the full +country number).');
      return;
    }
    if (!isFirebasePhoneConfigured()) {
      setError('Phone OTP is not configured in this build.');
      return;
    }
    const verifier = recaptchaRef.current;
    if (!verifier) {
      setError('Security check is still loading. Try again in a moment.');
      return;
    }
    setBusy('send');
    try {
      const id = await startFirebasePhoneOtp(e164, verifier);
      setVerificationId(id);
      setPhone(e164);
      setStage('code');
      setCodeState('');
      setWrongCodes(0);
      cooldown.start(options.cooldownSeconds ?? 30);
      setInfo(`OTP sent to ${maskPhone(e164)}.`);
      options.onSent?.(e164);
    } catch (err) {
      setError(firebasePhoneErrorMessage(err, 'Could not send the OTP.'));
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    if (cooldown.active || busy) return;
    await send();
  };

  const verify = async (override?: string): Promise<PhoneOtpVerified | null> => {
    const value = (override ?? code).trim();
    setError(null);
    if (!verificationId || !phone) {
      setError('Request a new OTP first.');
      return null;
    }
    if (!/^\d{6}$/.test(value)) {
      setError('Enter the 6-digit OTP.');
      return null;
    }
    setBusy('verify');
    try {
      const idToken = await confirmFirebasePhoneOtp(verificationId, value);
      setStage('verified');
      setInfo(null);
      return { idToken, phone };
    } catch (err) {
      setCodeState('');
      if (isWrongOtpError(err)) {
        const next = wrongCodes + 1;
        setWrongCodes(next);
        if (next >= MAX_WRONG_OTP) {
          setVerificationId(null);
          cooldown.clear();
          setError('Too many wrong codes. Request a new OTP.');
        } else {
          const left = MAX_WRONG_OTP - next;
          setError(`That OTP is wrong. ${left} attempt${left === 1 ? '' : 's'} left.`);
        }
      } else {
        if (requiresNewOtp(err)) {
          setVerificationId(null);
          cooldown.clear();
        }
        setError(firebasePhoneErrorMessage(err, 'Could not verify the OTP.'));
      }
      return null;
    } finally {
      setBusy(null);
    }
  };

  /** Verified already → force-refreshed token; otherwise confirm the SMS code. */
  const obtainIdToken = async (override?: string): Promise<PhoneOtpVerified | null> => {
    if (stage !== 'verified') return verify(override);
    setError(null);
    try {
      const idToken = await getFreshIdToken();
      if (idToken && phone) return { idToken, phone };
    } catch (err) {
      setError(firebasePhoneErrorMessage(err, 'Could not refresh phone verification.'));
      return null;
    }
    restart('Your phone verification ended. Resend the OTP and verify again.');
    return null;
  };

  const changeNumber = () => {
    void signOutFirebase();
    setStage('phone');
    setPhone(null);
    setVerificationId(null);
    setCodeState('');
    setWrongCodes(0);
    cooldown.clear();
    setError(null);
    setInfo(null);
  };

  /** Backend rejected the verification (expired / mismatch) — require a fresh SMS. */
  const restart = (message: string) => {
    void signOutFirebase();
    setStage(phone ? 'code' : 'phone');
    setVerificationId(null);
    setCodeState('');
    setWrongCodes(0);
    cooldown.clear();
    setInfo(null);
    setError(message);
  };

  return {
    recaptchaRef,
    stage,
    phone,
    phoneInput,
    setPhoneInput,
    code,
    setCode,
    busy,
    error,
    info,
    setError,
    cooldownSeconds: cooldown.seconds,
    needsResend: stage === 'code' && !verificationId,
    send,
    resend,
    verify,
    obtainIdToken,
    changeNumber,
    restart,
  };
}

export type FirebasePhoneOtp = ReturnType<typeof useFirebasePhoneOtp>;
