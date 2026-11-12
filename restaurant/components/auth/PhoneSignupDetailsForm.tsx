import { CheckCircle2, Lock, Mail, User } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import type { SignupEmailOtp } from '@/components/auth/useSignupEmailOtp';
import { theme } from '@/constants/theme';
import {
  PASSWORD_RULE_COPY,
  isStrongSignupPassword,
  isValidFirstName,
  isValidOptionalLastName,
  isValidSignupEmail,
} from '@/components/auth/signup-validators';

export type SignupDetails = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignupDetailErrors = Partial<Record<keyof SignupDetails, string>>;

export const EMPTY_SIGNUP_DETAILS: SignupDetails = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function validateSignupDetails(values: SignupDetails): SignupDetailErrors {
  const next: SignupDetailErrors = {};
  if (!isValidFirstName(values.firstName)) {
    next.firstName = '2-50 letters (spaces, \' and - allowed)';
  }
  if (!isValidOptionalLastName(values.lastName)) {
    next.lastName = 'Letters only, up to 50';
  }
  if (values.email.trim() && !isValidSignupEmail(values.email)) {
    next.email = 'Enter a valid email or leave it blank';
  }
  if (!isStrongSignupPassword(values.password)) next.password = PASSWORD_RULE_COPY;
  if (values.password !== values.confirmPassword) {
    next.confirmPassword = 'Passwords do not match';
  }
  return next;
}

type Props = {
  values: SignupDetails;
  errors: SignupDetailErrors;
  onChange: (patch: Partial<SignupDetails>) => void;
  disabled?: boolean;
  emailOtp?: SignupEmailOtp;
};

export function PhoneSignupDetailsForm({
  values,
  errors,
  onChange,
  disabled,
  emailOtp,
}: Props) {
  const email = values.email.trim();
  const showEmailVerify = Boolean(emailOtp?.shouldShowVerify(values.email));

  return (
    <View>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <AuthField
            label="First name *"
            icon={User}
            placeholder="Rajesh"
            autofill="givenName"
            value={values.firstName}
            editable={!disabled}
            onChangeText={(firstName) => onChange({ firstName })}
            errorText={errors.firstName}
          />
        </View>
        <View className="flex-1">
          <AuthField
            label="Last name"
            placeholder="Kumar"
            autofill="familyName"
            value={values.lastName}
            editable={!disabled}
            onChangeText={(lastName) => onChange({ lastName })}
            errorText={errors.lastName}
          />
        </View>
      </View>
      <AuthField
        label="Email (optional)"
        icon={Mail}
        placeholder="you@email.com"
        autofill="email"
        value={values.email}
        editable={!disabled}
        onChangeText={(nextEmail) => {
          emailOtp?.onEmailEdited(nextEmail);
          onChange({ email: nextEmail });
        }}
        errorText={errors.email}
      />
      <Text className="-mt-2 mb-3 text-xs text-secondary">
        Use the email already on your phone number, or enter a different one. Leave blank to keep the current email.
      </Text>
      {emailOtp?.isVerifiedEmail(values.email) ? (
        <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
          <CheckCircle2 color={theme.success} size={14} />
          <Text className="text-xs font-semibold text-green-700">Email verified</Text>
        </View>
      ) : null}
      {showEmailVerify ? (
        <View className="mb-4">
          <Text className="mb-2 text-xs text-secondary">
            Verify this email — we’ll send a 6-digit code before you create your account.
          </Text>
          <PrimaryButton
            label={
              emailOtp!.cooldownActive
                ? `Resend code in ${emailOtp!.cooldownSeconds}s`
                : emailOtp!.sentTo === email.trim().toLowerCase()
                  ? 'Resend email code'
                  : 'Send email verification code'
            }
            icon={Mail}
            variant="outline"
            onPress={() => void emailOtp!.sendCode(email)}
            loading={emailOtp!.sending}
            disabled={disabled || emailOtp!.cooldownActive || emailOtp!.sending}
          />
          {emailOtp!.sendError ? (
            <Text className="mt-2 text-xs text-red-600">{emailOtp!.sendError}</Text>
          ) : null}
          {emailOtp!.sentTo === email.trim().toLowerCase() ? (
            <View className="mt-3">
              <OtpCodeInput
                value={emailOtp!.emailOtp}
                onChange={emailOtp!.setEmailOtp}
                onComplete={(code) => void emailOtp!.confirmCode(email, code)}
                editable={!disabled && !emailOtp!.confirming}
                label="Email verification code"
                errorText={emailOtp!.verifyError ?? undefined}
              />
              <Pressable
                onPress={() => void emailOtp!.confirmCode(email)}
                disabled={disabled || emailOtp!.confirming || emailOtp!.emailOtp.length !== 6}
                className="mt-2"
              >
                <Text
                  className={`text-center text-xs font-bold ${
                    disabled || emailOtp!.emailOtp.length !== 6
                      ? 'text-secondary-light'
                      : 'text-primary'
                  }`}
                >
                  {emailOtp!.confirming ? 'Verifying…' : 'Confirm email code'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
      <AuthField
        label="Password *"
        icon={Lock}
        placeholder="8+ chars, mixed case, digit, symbol"
        secure
        autofill="newPassword"
        value={values.password}
        editable={!disabled}
        onChangeText={(password) => onChange({ password })}
        errorText={errors.password}
      />
      <AuthField
        label="Confirm password *"
        icon={Lock}
        placeholder="Re-enter password"
        secure
        autofill="newPassword"
        value={values.confirmPassword}
        editable={!disabled}
        onChangeText={(confirmPassword) => onChange({ confirmPassword })}
        errorText={errors.confirmPassword}
      />
    </View>
  );
}
