import { Lock, Mail, User } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
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
};

export function PhoneSignupDetailsForm({
  values,
  errors,
  onChange,
  disabled,
}: Props) {
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
        onChangeText={(email) => onChange({ email })}
        errorText={errors.email}
      />
      <Text className="-mt-2 mb-4 text-xs text-secondary-light">
        Use the email already on this number, or enter a different one. Leave it blank to keep the current email.
      </Text>
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
