import { Mail, ShieldCheck } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { FirebasePhoneVerifyCard } from '@/components/auth/FirebasePhoneVerifyCard';
import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import type { PasswordChangeFlow } from '@/components/auth/use-password-change-flow';
import { theme } from '@/constants/theme';

/** Email OTP (if the account has an email) + Firebase phone OTP (if it has a phone). */
export function PasswordChangeVerifyStep({ flow }: { flow: PasswordChangeFlow }) {
  const { info } = flow;

  if (!info) {
    return (
      <View>
        <AuthBanner type="error" message={flow.error} />
        <PrimaryButton
          label="Try again"
          onPress={() => void flow.resendEmail()}
          loading={flow.busy}
        />
      </View>
    );
  }

  return (
    <View>
      <AuthBanner type="error" message={flow.error} />

      {info.emailRequired ? (
        <View className="mb-6">
          <View className="mb-2 flex-row items-center gap-2">
            <Mail color={theme.primary} size={16} />
            <Text className="flex-1 text-sm font-semibold text-secondary">
              Code sent to {info.maskedEmail ?? 'your email'}
            </Text>
          </View>
          <OtpCodeInput
            value={flow.emailOtp}
            onChange={flow.setEmailOtp}
            onComplete={() => undefined}
            label="Email code"
            editable={!flow.busy}
          />
          <Pressable
            onPress={() => void flow.resendEmail()}
            disabled={flow.busy || flow.cooldownSeconds > 0}
            hitSlop={8}
            className="mt-3"
          >
            <Text
              className="text-center text-sm font-semibold"
              style={{ color: flow.cooldownSeconds > 0 ? theme.muted : theme.primary }}
            >
              {flow.cooldownSeconds > 0
                ? `Resend email code in ${flow.cooldownSeconds}s`
                : 'Resend email code'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {info.phoneRequired && info.phone ? (
        <View>
          <Text className="mb-2 text-sm font-semibold text-secondary">
            {info.emailRequired ? 'Then verify your phone' : 'Verify your phone'}
          </Text>
          <FirebasePhoneVerifyCard
            initialPhone={info.phone}
            lockPhone
            phoneLabel="Registered number"
            submitLabel="Verify & continue"
            onVerified={flow.onPhoneVerified}
          />
        </View>
      ) : (
        <PrimaryButton
          label="Verify & continue"
          icon={ShieldCheck}
          onPress={() => void flow.verifyEmailOnly()}
          loading={flow.busy}
          disabled={!flow.emailReady}
        />
      )}
    </View>
  );
}
