import { useRouter } from 'expo-router';
import { CheckCircle2, LogIn, UserPlus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { PhoneOtpStep } from '@/components/auth/PhoneOtpStep';
import { PhoneSignupDetailsForm } from '@/components/auth/PhoneSignupDetailsForm';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import type { PhoneSignup } from '@/components/auth/usePhoneSignup';
import { theme } from '@/constants/theme';
import { maskPhone } from '@/lib/auth/phone-number';
import type { PartnerRole } from '@/lib/auth/types';

type Props = {
  signup: PhoneSignup;
  role: PartnerRole;
  submitLabel: string;
  onSubmit: () => void;
  /** Extra in-flight work after register (session, partner profile). */
  busy?: boolean;
};

/** Verify phone with Firebase OTP, then collect details for /auth/phone/register. */
export function PhoneSignupFlow({ signup, role, submitLabel, onSubmit, busy }: Props) {
  const router = useRouter();
  const working = signup.submitting || Boolean(busy);

  if (signup.step === 'phone') {
    return (
      <View>
        <Text className="mb-3 text-xs text-secondary-light">
          Step 1 of 2 · Verify your mobile number. It becomes your sign-in.
        </Text>
        <PhoneOtpStep
          otp={signup.otp}
          availability={signup.availability}
          onSubmit={(code) => void signup.verifyPhone(code)}
          submitLabel="Verify number"
        />
        {signup.alreadyRegistered && signup.otp.stage === 'phone' ? (
          <View className="mt-3">
            <PrimaryButton
              label="Sign in with OTP"
              icon={LogIn}
              variant="outline"
              onPress={() =>
                router.replace({
                  pathname: '/verify-otp',
                  params: { role, phone: signup.otp.phoneInput },
                })
              }
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View>
      <Text className="mb-3 text-xs text-secondary-light">
        Step 2 of 2 · Your details and a password for email sign-in.
      </Text>
      <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
        <CheckCircle2 color={theme.success} size={16} />
        <Text className="flex-1 text-sm font-semibold text-green-700">
          {signup.otp.phone ? maskPhone(signup.otp.phone) : 'Phone'} verified
        </Text>
        <Pressable onPress={signup.changeNumber} disabled={working} hitSlop={8}>
          <Text className="text-xs font-bold text-primary">Change</Text>
        </Pressable>
      </View>

      <AuthBanner type="error" message={signup.error} />
      {signup.alreadyRegistered ? (
        <View className="mb-4">
          <PrimaryButton
            label="Sign in with OTP"
            icon={LogIn}
            variant="outline"
            onPress={() =>
              router.replace({
                pathname: '/verify-otp',
                params: { role, phone: signup.otp.phone ?? '' },
              })
            }
          />
        </View>
      ) : null}

      <PhoneSignupDetailsForm
        values={signup.details}
        errors={signup.fieldErrors}
        onChange={signup.patchDetails}
        disabled={working}
        emailOtp={signup.emailOtp}
      />

      <PrimaryButton
        label={submitLabel}
        icon={UserPlus}
        onPress={onSubmit}
        loading={working}
        disabled={working}
      />
    </View>
  );
}
