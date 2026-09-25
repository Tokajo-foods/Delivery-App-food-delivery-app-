import { CheckCircle2, Mail, Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { SignupPhoneVerify } from '@/components/auth/SignupPhoneVerify';
import {
  isSixDigitOtp,
  isValidSignupEmail,
} from '@/components/auth/signup-validators';
import { useOtpCountdown } from '@/components/auth/useOtpCountdown';
import { OtpValidityTimer } from '@/components/auth/OtpValidityTimer';
import { authApi, formatAuthError } from '@/lib/auth/api';
import { isFirebasePhoneConfigured } from '@/lib/auth/firebase-phone';
import type { PartnerRole, RegisterOtpPolicy } from '@/lib/auth/types';
import { theme } from '@/constants/theme';

export {
  isStrongSignupPassword,
  isValidSignupEmail,
  isValidSignupPhone,
} from '@/components/auth/signup-validators';

type SignupContactVerifyProps = {
  email: string;
  phone: string;
  role: PartnerRole;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  emailVerified: boolean;
  phoneVerified: boolean;
  onEmailVerifiedChange: (verified: boolean) => void;
  onPhoneVerifiedChange: (verified: boolean) => void;
  disabled?: boolean;
  emailError?: string;
  phoneError?: string;
};

/**
 * Email + phone fields with OTP for partner signup.
 * Fail-closed: Create account stays blocked until policy loads and required OTPs pass.
 */
export function SignupContactVerify({
  email,
  phone,
  role,
  onEmailChange,
  onPhoneChange,
  emailVerified,
  phoneVerified,
  onEmailVerifiedChange,
  onPhoneVerifiedChange,
  disabled,
  emailError,
  phoneError,
}: SignupContactVerifyProps) {
  const [policy, setPolicy] = useState<RegisterOtpPolicy | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState<'email-send' | 'email-ok' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const emailCooldown = useOtpCountdown();
  const emailValidity = useOtpCountdown();

  const loadPolicy = async () => {
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const next = await authApi.getRegisterPolicy();
      setPolicy(next);
      onEmailVerifiedChange(!next.requireEmailOtp);
      // Phone OTP only when server requires it AND Firebase Web keys exist (for firebase provider).
      const phoneReady =
        next.phoneProvider !== 'firebase' || isFirebasePhoneConfigured();
      onPhoneVerifiedChange(!(next.requirePhoneOtp && phoneReady));
    } catch (err) {
      setPolicy(null);
      setPolicyError(
        formatAuthError(
          err,
          'Could not load signup verification rules. Check connection and retry.'
        )
      );
      onEmailVerifiedChange(false);
      onPhoneVerifiedChange(false);
    } finally {
      setPolicyLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicy();
    // Intentionally once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setEmailSent(false);
    setEmailOtp('');
    emailCooldown.clear();
    emailValidity.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const requireEmail = policy?.requireEmailOtp ?? false;
  const firebasePhoneReady = isFirebasePhoneConfigured();
  const requirePhone =
    Boolean(policy?.requirePhoneOtp) &&
    (policy?.phoneProvider !== 'firebase' || firebasePhoneReady);
  const phoneOtpDeferred =
    Boolean(policy?.requirePhoneOtp) &&
    policy?.phoneProvider === 'firebase' &&
    !firebasePhoneReady;

  const sendEmail = async () => {
    setLocalError(null);
    const identifier = email.trim().toLowerCase();
    if (!isValidSignupEmail(identifier)) {
      setLocalError('Enter a valid email before sending OTP.');
      return;
    }
    setBusy('email-send');
    try {
      const result = await authApi.sendOtp({
        emailOrPhone: identifier,
        purpose: 'register',
        role,
      });
      setEmailSent(true);
      emailCooldown.start(
        result.cooldownSeconds || policy?.resendCooldownSeconds || 30
      );
      emailValidity.start(result.expiresInSeconds || 600);
    } catch (err) {
      setLocalError(formatAuthError(err, 'Could not send email OTP'));
    } finally {
      setBusy(null);
    }
  };

  const confirmEmail = async () => {
    setLocalError(null);
    const identifier = email.trim().toLowerCase();
    const otp = emailOtp.trim();
    if (!isSixDigitOtp(otp)) {
      setLocalError('Enter the 6-digit OTP.');
      return;
    }
    setBusy('email-ok');
    try {
      await authApi.confirmRegisterOtp({ emailOrPhone: identifier, otp });
      onEmailVerifiedChange(true);
      setEmailOtp('');
    } catch (err) {
      setLocalError(formatAuthError(err, 'Email OTP verification failed'));
    } finally {
      setBusy(null);
    }
  };

  const verifiedBadge = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <CheckCircle2 size={14} color={theme.success} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.success }}>
        Verified
      </Text>
    </View>
  );

  const emailSendLabel = emailCooldown.active
    ? `Resend in ${emailCooldown.seconds}s`
    : emailSent
      ? 'Resend email OTP'
      : 'Send email OTP';

  return (
    <View style={{ gap: 4 }}>
      <AuthBanner type="error" message={localError || policyError} />
      {policyLoading ? (
        <Text className="mb-2 text-xs text-secondary-light">
          Loading signup verification rules…
        </Text>
      ) : null}
      {policyError ? (
        <PrimaryButton
          label="Retry verification rules"
          variant="outline"
          loading={policyLoading}
          disabled={disabled || policyLoading}
          onPress={() => void loadPolicy()}
        />
      ) : null}
      {policy && !requireEmail && !requirePhone ? (
        <Text className="mb-2 text-xs text-secondary-light">
          {phoneOtpDeferred
            ? 'Phone OTP is skipped until Firebase Web keys are added. Email OTP still applies if required.'
            : 'Email/phone OTP is off on the server. Enter contacts and continue.'}
        </Text>
      ) : null}
      {phoneOtpDeferred ? (
        <Text className="mb-2 text-xs text-secondary-light">
          Phone marked verified for now. Add EXPO_PUBLIC_FIREBASE_API_KEY + APP_ID
          and set REQUIRE_REGISTER_PHONE_OTP=true to enable SMS verification.
        </Text>
      ) : null}

      <AuthField
        label="Email *"
        icon={Mail}
        placeholder="you@email.com"
        autofill="email"
        value={email}
        editable={!disabled}
        onChangeText={(v) => {
          onEmailChange(v);
          if (requireEmail && emailVerified) onEmailVerifiedChange(false);
        }}
        errorText={emailError}
        labelAccessory={
          emailVerified || (!requireEmail && policy) ? verifiedBadge : undefined
        }
      />
      {requireEmail && !emailVerified ? (
        <View style={{ gap: 8, marginBottom: 8 }}>
          <PrimaryButton
            label={emailSendLabel}
            variant="outline"
            loading={busy === 'email-send'}
            disabled={disabled || Boolean(busy) || emailCooldown.active}
            onPress={() => void sendEmail()}
          />
          {emailSent ? (
            <>
              <OtpValidityTimer secondsLeft={emailValidity.seconds} />
              <AuthField
                label="Email OTP"
                placeholder="6-digit code"
                autofill="oneTimeCode"
                keyboardType="number-pad"
                maxLength={6}
                value={emailOtp}
                onChangeText={setEmailOtp}
              />
              <PrimaryButton
                label="Verify email"
                loading={busy === 'email-ok'}
                disabled={
                  disabled || Boolean(busy) || emailValidity.seconds <= 0
                }
                onPress={() => void confirmEmail()}
              />
            </>
          ) : null}
        </View>
      ) : null}

      <AuthField
        label="Phone *"
        icon={Phone}
        placeholder="+919876543210"
        autofill="telephone"
        value={phone}
        editable={!disabled}
        onChangeText={(v) => {
          onPhoneChange(v);
          if (requirePhone && phoneVerified) onPhoneVerifiedChange(false);
        }}
        errorText={phoneError}
        labelAccessory={
          phoneVerified || (!requirePhone && policy) ? verifiedBadge : undefined
        }
      />
      <Text className="mb-2 -mt-1 text-xs text-secondary-light">
        Use E.164 format, e.g. +919876543210
        {requireEmail || requirePhone
          ? '. Required contacts must be OTP-verified before create.'
          : '.'}
      </Text>
      {requirePhone && !phoneVerified && policy ? (
        <SignupPhoneVerify
          phone={phone}
          role={role}
          phoneProvider={policy.phoneProvider}
          resendCooldownSeconds={policy.resendCooldownSeconds}
          disabled={disabled}
          onVerified={() => onPhoneVerifiedChange(true)}
          onError={setLocalError}
        />
      ) : null}
    </View>
  );
}
