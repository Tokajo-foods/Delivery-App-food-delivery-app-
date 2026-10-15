import { Lock, ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';

type Props = {
  password: string;
  confirmPassword: string;
  passwordError?: string;
  confirmError?: string;
  busy: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onSave: () => void;
};

export function PasswordResetPasswordFields({
  password,
  confirmPassword,
  passwordError,
  confirmError,
  busy,
  onPasswordChange,
  onConfirmChange,
  onSave,
}: Props) {
  return (
    <View className="gap-3">
      <AuthField
        label="New password"
        icon={Lock}
        placeholder="8+ chars, mixed case, digit, symbol"
        secure
        autofill="newPassword"
        value={password}
        onChangeText={onPasswordChange}
        errorText={passwordError}
      />
      <AuthField
        label="Confirm new password"
        icon={Lock}
        placeholder="Re-enter password"
        secure
        autofill="newPassword"
        value={confirmPassword}
        onChangeText={onConfirmChange}
        errorText={confirmError}
      />
      <PrimaryButton
        label="Save new password"
        icon={ShieldCheck}
        onPress={onSave}
        loading={busy}
        disabled={busy}
      />
    </View>
  );
}
