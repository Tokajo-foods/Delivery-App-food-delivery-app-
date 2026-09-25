import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordResetContactStep } from '@/components/auth/PasswordResetContactStep';
import { PasswordResetSuccessModal } from '@/components/auth/PasswordResetSuccessModal';
import { PasswordResetStepHeader } from '@/components/auth/PasswordResetStepHeader';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useOtpCountdown } from '@/components/auth/useOtpCountdown';
import {
  isSixDigitOtp,
  isStrongSignupPassword,
  isValidSignupEmail,
  isValidSignupPhone,
} from '@/components/auth/signup-validators';
import { authApi, formatAuthError } from '@/lib/auth/api';
import { theme } from '@/constants/theme';

type Channel = 'email' | 'phone';
type Step = 'contact' | 'otp' | 'password';

const STEP_COPY: Record<Step, { title: string; subtitle: string }> = {
  contact: {
    title: 'Reset password',
    subtitle:
      'Enter the email or phone on your Tokajo Foods account. We’ll send a one-time code if it exists.',
  },
  otp: {
    title: 'Enter verification code',
    subtitle: 'We sent a 6-digit code. Enter it below to continue.',
  },
  password: {
    title: 'Set new password',
    subtitle: 'Choose a strong password, then confirm it.',
  },
};

export function PasswordResetWizard() {
  const router = useRouter();
  const cooldown = useOtpCountdown();

  const [step, setStep] = useState<Step>('contact');
  const [channel, setChannel] = useState<Channel>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const identifier = useMemo(() => {
    return channel === 'email' ? email.trim().toLowerCase() : phone.trim();
  }, [channel, email, phone]);

  const maskedDestination = useMemo(() => {
    if (channel === 'email') {
      const [user, domain] = identifier.split('@');
      if (!user || !domain) return identifier;
      const visible = user.slice(0, 2);
      return `${visible}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`;
    }
    if (identifier.length < 6) return identifier;
    return `${identifier.slice(0, 4)}••••${identifier.slice(-3)}`;
  }, [channel, identifier]);

  const copy = STEP_COPY[step];

  const goBack = () => {
    setError(null);
    setInfo(null);
    if (step === 'otp') setStep('contact');
    else if (step === 'password') setStep('otp');
    else router.back();
  };

  const sendOtp = async () => {
    setError(null);
    setInfo(null);
    const nextErrors: Record<string, string> = {};
    if (channel === 'email' && !isValidSignupEmail(email)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (channel === 'phone' && !isValidSignupPhone(phone)) {
      nextErrors.phone = 'Use E.164 format, e.g. +919876543210';
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const result = await authApi.sendOtp({
        emailOrPhone: identifier,
        purpose: 'forgot_password',
      });
      setInfo(
        channel === 'email'
          ? `If an account exists for ${maskedDestination}, a code was sent to that inbox.`
          : `If an account exists for ${maskedDestination}, a code was sent by SMS.`,
      );
      cooldown.start(result.cooldownSeconds || 30);
      setStep('otp');
      setOtp('');
    } catch (err) {
      setError(formatAuthError(err, 'Could not send reset code'));
    } finally {
      setBusy(false);
    }
  };

  const confirmOtp = async () => {
    setError(null);
    if (!isSixDigitOtp(otp)) {
      setFieldErrors({ otp: 'Enter the 6-digit code' });
      return;
    }
    setFieldErrors({});
    setBusy(true);
    try {
      await authApi.confirmForgotPasswordOtp({
        emailOrPhone: identifier,
        otp: otp.trim(),
      });
      setInfo('Code verified. Set your new password.');
      setStep('password');
    } catch (err) {
      setError(formatAuthError(err, 'Invalid or expired code'));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setError(null);
    const next: Record<string, string> = {};
    if (!isStrongSignupPassword(password)) {
      next.password =
        'Min 8 chars with upper, lower, digit, and special character';
    }
    if (password !== confirmPassword) {
      next.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      await authApi.resetPasswordWithOtp({
        identifier,
        password,
        confirmPassword,
      });
      setShowSuccess(true);
    } catch (err) {
      setError(formatAuthError(err, 'Could not reset password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AuthShell
        title={copy.title}
        subtitle={
          step === 'otp'
            ? `${copy.subtitle} Sent to ${maskedDestination}.`
            : copy.subtitle
        }
        showBack
        onBackPress={goBack}
        footer={
          <Pressable
            onPress={() => router.replace('/login')}
            hitSlop={8}
            className="flex-row items-center justify-center gap-1.5"
          >
            <ArrowLeft color={theme.primary} size={16} />
            <Text className="text-sm font-bold text-primary">Back to sign in</Text>
          </Pressable>
        }
      >
        <PasswordResetStepHeader step={step} />
        <AuthBanner type="error" message={error} />
        <AuthBanner type="success" message={info} />

        {step === 'contact' ? (
          <PasswordResetContactStep
            channel={channel}
            email={email}
            phone={phone}
            fieldErrors={fieldErrors}
            busy={busy}
            cooldownActive={cooldown.active}
            cooldownSeconds={cooldown.seconds}
            onChannelChange={(next) => {
              setChannel(next);
              setError(null);
              setFieldErrors({});
            }}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
            onSend={() => void sendOtp()}
          />
        ) : null}

        {step === 'otp' ? (
          <View className="gap-3">
            <AuthField
              label="Verification code"
              placeholder="6-digit code"
              autofill="oneTimeCode"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              errorText={fieldErrors.otp}
            />
            <PrimaryButton
              label="Verify code"
              icon={ShieldCheck}
              onPress={() => void confirmOtp()}
              loading={busy}
              disabled={busy}
            />
            <PrimaryButton
              label={
                cooldown.active
                  ? `Resend in ${cooldown.seconds}s`
                  : 'Resend code'
              }
              variant="outline"
              onPress={() => void sendOtp()}
              disabled={busy || cooldown.active}
            />
          </View>
        ) : null}

        {step === 'password' ? (
          <View className="gap-3">
            <AuthField
              label="New password"
              icon={Lock}
              placeholder="8+ chars, mixed case, digit, symbol"
              secure
              autofill="newPassword"
              value={password}
              onChangeText={setPassword}
              errorText={fieldErrors.password}
            />
            <AuthField
              label="Confirm new password"
              icon={Lock}
              placeholder="Re-enter password"
              secure
              autofill="newPassword"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              errorText={fieldErrors.confirmPassword}
            />
            <PrimaryButton
              label="Save new password"
              icon={ShieldCheck}
              onPress={() => void savePassword()}
              loading={busy}
              disabled={busy}
            />
          </View>
        ) : null}
      </AuthShell>

      <PasswordResetSuccessModal
        visible={showSuccess}
        onSignIn={() => {
          setShowSuccess(false);
          router.replace('/login');
        }}
      />
    </>
  );
}
