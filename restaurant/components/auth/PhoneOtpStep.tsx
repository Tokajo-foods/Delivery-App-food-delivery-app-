import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { CheckCircle2, MessageSquareCode, Smartphone } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthField } from '@/components/auth/AuthField';
import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import type { FirebasePhoneOtp } from '@/components/auth/useFirebasePhoneOtp';
import type { PhoneAuthAvailability } from '@/components/auth/usePhoneAuthStatus';
import { theme } from '@/constants/theme';
import { getFirebaseWebConfig } from '@/lib/auth/firebase-phone';
import { maskPhone } from '@/lib/auth/phone-number';

type Props = {
  otp: FirebasePhoneOtp;
  availability: PhoneAuthAvailability;
  /** Runs after a 6-digit code is entered (button or SMS autofill). */
  onSubmit: (code?: string) => void;
  submitLabel: string;
  /** Backend call in flight after Firebase verification. */
  submitting?: boolean;
  phoneLabel?: string;
  /** Number is fixed (registered phone): not editable, no "Change number". */
  lockPhone?: boolean;
};

export function PhoneOtpStep({
  otp,
  availability,
  onSubmit,
  submitLabel,
  submitting = false,
  phoneLabel = 'Mobile number',
  lockPhone = false,
}: Props) {
  const blocked = Boolean(availability.unavailable);
  const busy = Boolean(otp.busy) || submitting;

  return (
    <View>
      {!blocked ? (
        <FirebaseRecaptchaVerifierModal
          ref={otp.recaptchaRef}
          firebaseConfig={getFirebaseWebConfig()}
          attemptInvisibleVerification
        />
      ) : null}

      <AuthBanner type="error" message={availability.unavailable} />
      {availability.loadError && !blocked ? (
        <Pressable onPress={availability.retry} hitSlop={8} className="mb-3">
          <Text className="text-xs font-semibold text-[#B45309]">
            {availability.loadError} Tap to retry.
          </Text>
        </Pressable>
      ) : null}
      <AuthBanner type="error" message={otp.error} />
      <AuthBanner type="success" message={otp.info} />

      {otp.stage === 'phone' ? (
        <>
          <AuthField
            label={phoneLabel}
            icon={Smartphone}
            placeholder="98765 43210"
            autofill="telephone"
            value={otp.phoneInput}
            onChangeText={otp.setPhoneInput}
            editable={!busy && !blocked && !lockPhone}
          />
          <Text className="-mt-2 mb-4 text-xs text-secondary-light">
            India (+91) by default. For other countries enter the full +country number.
          </Text>
          <PrimaryButton
            label="Send OTP"
            icon={MessageSquareCode}
            onPress={() => void otp.send()}
            loading={otp.busy === 'send'}
            disabled={busy || blocked || availability.loading}
          />
        </>
      ) : null}

      {otp.stage === 'code' ? (
        <>
          {otp.needsResend ? null : (
            <OtpCodeInput
              value={otp.code}
              onChange={otp.setCode}
              onComplete={(code) => onSubmit(code)}
              editable={!busy}
            />
          )}
          {otp.needsResend ? (
            <PrimaryButton
              label={otp.busy === 'send' ? 'Sending…' : 'Resend OTP'}
              icon={MessageSquareCode}
              onPress={() => void otp.resend()}
              loading={otp.busy === 'send'}
              disabled={busy || blocked}
            />
          ) : (
            <PrimaryButton
              label={submitLabel}
              onPress={() => onSubmit()}
              loading={otp.busy === 'verify' || submitting}
              disabled={busy || otp.code.length !== 6}
            />
          )}
          {!otp.needsResend ? (
            <Pressable
              onPress={() => void otp.resend()}
              disabled={busy || otp.cooldownSeconds > 0}
              hitSlop={8}
              className="mt-4"
            >
              <Text
                className="text-center text-sm font-semibold"
                style={{ color: otp.cooldownSeconds > 0 ? theme.muted : theme.primary }}
              >
                {otp.cooldownSeconds > 0
                  ? `Resend OTP in ${otp.cooldownSeconds}s`
                  : 'Resend OTP'}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {otp.stage === 'verified' && otp.phone ? (
        <>
          <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
            <CheckCircle2 color={theme.success} size={16} />
            <Text className="flex-1 text-sm font-semibold text-green-700">
              {maskPhone(otp.phone)} verified
            </Text>
          </View>
          <PrimaryButton
            label={submitLabel}
            onPress={() => onSubmit()}
            loading={submitting}
            disabled={busy}
          />
        </>
      ) : null}

      {otp.stage !== 'phone' && !lockPhone ? (
        <Pressable onPress={otp.changeNumber} disabled={busy} hitSlop={8} className="mt-3">
          <Text className="text-center text-sm font-medium text-secondary-light">
            Change number
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
