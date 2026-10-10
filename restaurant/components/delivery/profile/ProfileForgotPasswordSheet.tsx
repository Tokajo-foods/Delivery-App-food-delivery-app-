import { useRouter } from 'expo-router';
import { Lock, ShieldCheck, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { OtpValidityTimer } from '@/components/auth/OtpValidityTimer';
import { PasswordResetContactStep } from '@/components/auth/PasswordResetContactStep';
import { PasswordResetSuccessModal } from '@/components/auth/PasswordResetSuccessModal';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { useOtpCountdown } from '@/components/auth/useOtpCountdown';
import {
  isSixDigitOtp,
  isStrongSignupPassword,
  isValidSignupEmail,
  isValidSignupPhone,
} from '@/components/auth/signup-validators';
import { fonts } from '@/constants/typography';
import { authApi, formatAuthError } from '@/lib/auth/api';
import { useAuthStore } from '@/store/auth-store';

type Channel = 'email' | 'phone';
type Step = 'contact' | 'otp' | 'password';

type Props = {
  visible: boolean;
  email: string;
  phone: string;
  onClose: () => void;
};

export function ProfileForgotPasswordSheet({ visible, email, phone, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const cooldown = useOtpCountdown();
  const validity = useOtpCountdown();
  const [step, setStep] = useState<Step>('contact');
  const [channel, setChannel] = useState<Channel>('email');
  const [emailValue, setEmailValue] = useState(email);
  const [phoneValue, setPhoneValue] = useState(phone);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep('contact');
    setChannel(email.trim() ? 'email' : 'phone');
    setEmailValue(email);
    setPhoneValue(phone);
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setShowSuccess(false);
  }, [visible, email, phone]);

  const identifier = channel === 'email' ? emailValue.trim().toLowerCase() : phoneValue.trim();
  const masked = useMemo(() => maskDestination(channel, identifier), [channel, identifier]);

  const sendOtp = async () => {
    setError(null);
    const next: Record<string, string> = {};
    if (channel === 'email' && !isValidSignupEmail(emailValue)) next.email = 'Enter a valid email address';
    if (channel === 'phone' && !isValidSignupPhone(phoneValue)) {
      next.phone = 'Use E.164 format, e.g. +919876543210';
    }
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const result = await authApi.sendOtp({ emailOrPhone: identifier, purpose: 'forgot_password' });
      cooldown.start(result.cooldownSeconds || 30);
      validity.start(result.expiresInSeconds || 600);
      setOtp('');
      setInfo(`Code sent to ${masked}`);
      setStep('otp');
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
      await authApi.confirmForgotPasswordOtp({ emailOrPhone: identifier, otp: otp.trim() });
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
      next.password = 'Min 8 chars with upper, lower, digit, and special character';
    }
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setFieldErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await authApi.resetPasswordWithOtp({ identifier, password, confirmPassword });
      setShowSuccess(true);
    } catch (err) {
      setError(formatAuthError(err, 'Could not reset password'));
    } finally {
      setBusy(false);
    }
  };

  const title = step === 'otp' ? 'Enter the code' : step === 'password' ? 'New password' : 'Forgot password';

  return (
    <>
      <Modal visible={visible && !showSuccess} animationType="slide" transparent onRequestClose={onClose}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.45)' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              maxHeight: '88%',
              paddingTop: 14,
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#0F172A' }}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X color="#64748B" size={18} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <AuthBanner type="error" message={error} />
              <AuthBanner type="success" message={info} />
              {step === 'contact' ? (
                <PasswordResetContactStep
                  channel={channel}
                  email={emailValue}
                  phone={phoneValue}
                  fieldErrors={fieldErrors}
                  busy={busy}
                  cooldownActive={cooldown.active}
                  cooldownSeconds={cooldown.seconds}
                  onChannelChange={(next) => {
                    setChannel(next);
                    setError(null);
                    setFieldErrors({});
                  }}
                  onEmailChange={setEmailValue}
                  onPhoneChange={setPhoneValue}
                  onSend={() => void sendOtp()}
                />
              ) : null}
              {step === 'otp' ? (
                <View className="gap-3">
                  <OtpValidityTimer secondsLeft={validity.seconds} />
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
                    disabled={busy || validity.seconds <= 0}
                  />
                  <PrimaryButton
                    label={cooldown.active ? `Resend in ${cooldown.seconds}s` : 'Resend code'}
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
                    value={password}
                    onChangeText={setPassword}
                    errorText={fieldErrors.password}
                  />
                  <AuthField
                    label="Confirm new password"
                    icon={Lock}
                    placeholder="Re-enter password"
                    secure
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
            </ScrollView>
          </View>
        </View>
      </Modal>
      <PasswordResetSuccessModal
        visible={showSuccess}
        onSignIn={() => {
          setShowSuccess(false);
          onClose();
          void logout().finally(() => router.replace('/login'));
        }}
      />
    </>
  );
}

function maskDestination(channel: Channel, identifier: string) {
  if (channel === 'email') {
    const [user, domain] = identifier.split('@');
    if (!user || !domain) return identifier;
    return `${user.slice(0, 2)}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`;
  }
  if (identifier.length < 6) return identifier;
  return `${identifier.slice(0, 4)}••••${identifier.slice(-3)}`;
}
