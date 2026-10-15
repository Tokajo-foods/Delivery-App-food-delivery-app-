import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordResetSuccessModal } from '@/components/auth/PasswordResetSuccessModal';
import { PhoneOtpStep } from '@/components/auth/PhoneOtpStep';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { isStrongSignupPassword } from '@/components/auth/signup-validators';
import { useFirebasePhoneOtp } from '@/components/auth/useFirebasePhoneOtp';
import { usePhoneAuthStatus } from '@/components/auth/usePhoneAuthStatus';
import { theme } from '@/constants/theme';
import { formatAuthError } from '@/lib/auth/api';
import { phoneAuthApi } from '@/lib/auth/phone-auth-api';
import { getApiErrorCode } from '@/lib/errors';

const RESTART = new Set(['FIREBASE_TOKEN_EXPIRED', 'FIREBASE_TOKEN_INVALID', 'PHONE_MISMATCH']);

type Props = {
  initialPhone: string;
  onBack: () => void;
};

/** Forgot password: Firebase SMS → reset token → new password. */
export function PhonePasswordResetFlow({ initialPhone, onBack }: Props) {
  const router = useRouter();
  const availability = usePhoneAuthStatus();
  const otp = useFirebasePhoneOtp({
    initialPhone,
    cooldownSeconds: availability.status?.resendCooldownSeconds,
  });
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const issueToken = async (code?: string) => {
    if (busy) return;
    setError(null);
    const verified = await otp.obtainIdToken(code);
    if (!verified) return;
    setBusy(true);
    try {
      const issued = await phoneAuthApi.forgotPassword({
        idToken: verified.idToken,
        phone: verified.phone,
      });
      setResetToken(issued.resetToken);
    } catch (err) {
      const codeName = getApiErrorCode(err);
      if (codeName && RESTART.has(codeName)) {
        otp.restart(formatAuthError(err, 'Verify your phone again.'));
      } else {
        setError(formatAuthError(err, 'Could not start the password reset.'));
      }
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!resetToken || busy) return;
    const next: Record<string, string> = {};
    if (!isStrongSignupPassword(password)) {
      next.password = 'Min 8 chars with upper, lower, digit, and special character';
    }
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return;
    setBusy(true);
    setError(null);
    try {
      await phoneAuthApi.resetPassword({ resetToken, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(formatAuthError(err, 'Could not reset password'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AuthShell
        title={resetToken ? 'Set new password' : 'Reset with phone OTP'}
        subtitle={
          resetToken
            ? 'Choose a strong password. Other devices will be signed out.'
            : 'We’ll text a 6-digit code. Enter it to set a new password.'
        }
        showBack
        onBackPress={resetToken ? () => setResetToken(null) : onBack}
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
        <AuthBanner type="error" message={error} />
        {resetToken ? (
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
              onPress={() => void save()}
              loading={busy}
              disabled={busy}
            />
          </View>
        ) : (
          <PhoneOtpStep
            otp={otp}
            availability={availability}
            onSubmit={(code) => void issueToken(code)}
            submitLabel="Verify & continue"
            submitting={busy}
          />
        )}
      </AuthShell>
      <PasswordResetSuccessModal
        visible={done}
        onSignIn={() => {
          setDone(false);
          router.replace('/login');
        }}
      />
    </>
  );
}
