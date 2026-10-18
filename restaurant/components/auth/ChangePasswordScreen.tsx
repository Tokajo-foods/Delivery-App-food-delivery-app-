import { useRouter } from 'expo-router';
import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { AuthShell } from '@/components/auth/AuthShell';
import { PasswordChangeVerifyStep } from '@/components/auth/PasswordChangeVerifyStep';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { usePasswordChangeFlow } from '@/components/auth/use-password-change-flow';
import { theme } from '@/constants/theme';

const SUBTITLES = {
  loading: 'Sending verification codes…',
  verify: 'Verify the codes sent to your registered email and phone.',
  password: 'Choose a new password for your partner account.',
  done: 'Your password has been changed.',
} as const;

/** Settings password change: email OTP + phone OTP, then the new password. */
export function ChangePasswordScreen() {
  const router = useRouter();
  const flow = usePasswordChangeFlow();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <AuthShell title="Change password" subtitle={SUBTITLES[flow.stage]} showBack>
      {flow.stage === 'loading' ? <ActivityIndicator color={theme.primary} /> : null}

      {flow.stage === 'verify' ? <PasswordChangeVerifyStep flow={flow} /> : null}

      {flow.stage === 'password' ? (
        <>
          <AuthBanner type="error" message={flow.error} />
          <AuthField
            label="New password"
            icon={Lock}
            placeholder="8+ chars, upper, lower, digit, symbol"
            secure
            autofill="newPassword"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <AuthField
            label="Confirm new password"
            icon={Lock}
            placeholder="Re-enter new password"
            secure
            autofill="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <View className="mt-2">
            <PrimaryButton
              label="Update password"
              icon={ShieldCheck}
              onPress={() => void flow.confirm(newPassword, confirmPassword)}
              loading={flow.busy}
            />
          </View>
        </>
      ) : null}

      {flow.stage === 'done' ? (
        <View>
          <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
            <CheckCircle2 color={theme.success} size={18} />
            <Text className="flex-1 text-sm font-semibold text-green-700">
              Password changed. Other devices were signed out.
            </Text>
          </View>
          <PrimaryButton label="Done" onPress={() => router.back()} />
        </View>
      ) : null}
    </AuthShell>
  );
}
