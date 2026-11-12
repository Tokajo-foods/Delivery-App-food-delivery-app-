import { Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type Props = {
  aadharNumber: string;
  onChange: (patch: { aadharNumber?: string }) => void;
};

/** Optional KYC at signup — full rider policy is accepted on the home screen modal. */
export function RegisterTermsStep({ aadharNumber, onChange }: Props) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: authTheme.textMuted }}>
        Partner terms appear on your home screen after signup. You can add Aadhaar now or later in
        Documents.
      </Text>
      <AuthField
        label="Aadhaar number (optional)"
        placeholder="12-digit number"
        keyboardType="number-pad"
        value={aadharNumber}
        onChangeText={(value) => onChange({ aadharNumber: value })}
      />
    </View>
  );
}
