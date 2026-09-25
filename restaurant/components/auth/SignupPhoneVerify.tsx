import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { isSixDigitOtp, isValidSignupPhone } from '@/components/auth/signup-validators';
import { useOtpCountdown } from '@/components/auth/useOtpCountdown';
import { authApi, formatAuthError } from '@/lib/auth/api';
import {
  confirmFirebasePhoneOtp,
  getFirebaseWebConfig,
  isFirebasePhoneConfigured,
  startFirebasePhoneOtp,
} from '@/lib/auth/firebase-phone';
import type { PartnerRole } from '@/lib/auth/types';

type Props = {
  phone: string;
  role: PartnerRole;
  phoneProvider: 'firebase' | 'sms';
  resendCooldownSeconds: number;
  disabled?: boolean;
  onVerified: () => void;
  onError: (message: string | null) => void;
};

/**
 * Partner signup phone proof: Firebase Phone Auth (production) or server SMS OTP.
 */
export function SignupPhoneVerify({
  phone,
  role,
  phoneProvider,
  resendCooldownSeconds,
  disabled,
  onVerified,
  onError,
}: Props) {
  const recaptchaRef = useRef<FirebaseRecaptchaVerifierModal>(null);
  const cooldown = useOtpCooldown();
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [busy, setBusy] = useState<'send' | 'ok' | null>(null);
  const useFirebase = phoneProvider === 'firebase';
  const firebaseReady = isFirebasePhoneConfigured();

  useEffect(() => {
    setSent(false);
    setOtp('');
    setVerificationId(null);
    cooldown.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when phone changes
  }, [phone]);

  const send = async () => {
    onError(null);
    const identifier = phone.trim();
    if (!isValidSignupPhone(identifier)) {
      onError('Use E.164 phone format, e.g. +919876543210');
      return;
    }

    if (useFirebase && !firebaseReady) {
      onError(
        'Firebase Phone Auth is not configured in the app. Add EXPO_PUBLIC_FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, and APP_ID.'
      );
      return;
    }

    setBusy('send');
    try {
      if (useFirebase) {
        const verifier = recaptchaRef.current;
        if (!verifier) {
          onError('reCAPTCHA is not ready. Try again.');
          return;
        }
        const id = await startFirebasePhoneOtp(identifier, verifier);
        setVerificationId(id);
        setSent(true);
        cooldown.start(resendCooldownSeconds);
      } else {
        const result = await authApi.sendOtp({
          emailOrPhone: identifier,
          purpose: 'register',
          role,
        });
        setSent(true);
        cooldown.start(result.cooldownSeconds || resendCooldownSeconds);
      }
    } catch (err) {
      onError(formatAuthError(err, 'Could not send phone OTP'));
    } finally {
      setBusy(null);
    }
  };

  const confirm = async () => {
    onError(null);
    const identifier = phone.trim();
    const code = otp.trim();
    if (!isSixDigitOtp(code)) {
      onError('Enter the 6-digit OTP.');
      return;
    }
    setBusy('ok');
    try {
      if (useFirebase) {
        if (!verificationId) {
          onError('Request a phone OTP first.');
          return;
        }
        const idToken = await confirmFirebasePhoneOtp(verificationId, code);
        await authApi.confirmFirebasePhone({ idToken, role });
      } else {
        await authApi.confirmRegisterOtp({ emailOrPhone: identifier, otp: code });
      }
      onVerified();
      setOtp('');
    } catch (err) {
      onError(formatAuthError(err, 'Phone verification failed'));
    } finally {
      setBusy(null);
    }
  };

  const sendLabel = (() => {
    if (cooldown.active) return `Resend in ${cooldown.seconds}s`;
    if (sent) return useFirebase ? 'Resend Firebase SMS' : 'Resend SMS OTP';
    return useFirebase ? 'Send Firebase SMS' : 'Send SMS OTP';
  })();

  return (
    <View style={{ gap: 8, marginBottom: 8 }}>
      {useFirebase ? (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaRef}
          firebaseConfig={getFirebaseWebConfig()}
          attemptInvisibleVerification
        />
      ) : null}
      {useFirebase && !firebaseReady ? (
        <Text className="text-xs text-amber-700">
          Add Firebase Web app keys to the restaurant `.env` before phone OTP works.
        </Text>
      ) : null}
      <PrimaryButton
        label={sendLabel}
        variant="outline"
        loading={busy === 'send'}
        disabled={disabled || Boolean(busy) || cooldown.active}
        onPress={() => void send()}
      />
      {sent ? (
        <>
          <AuthField
            label={useFirebase ? 'Firebase SMS code' : 'SMS OTP'}
            placeholder="6-digit code"
            autofill="oneTimeCode"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
          <PrimaryButton
            label="Verify phone"
            loading={busy === 'ok'}
            disabled={disabled || Boolean(busy)}
            onPress={() => void confirm()}
          />
        </>
      ) : null}
    </View>
  );
}
