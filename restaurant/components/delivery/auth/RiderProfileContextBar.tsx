import { Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { maskPhone } from '@/lib/auth/phone-number';

type Props = {
  displayName: string;
  phone?: string;
  email?: string;
};

/** Verified account summary — one line, no extra form fields. */
export function RiderProfileContextBar({ displayName, phone, email }: Props) {
  const parts = [displayName.trim() || 'Delivery partner'];
  if (phone?.trim()) parts.push(maskPhone(phone.trim()));
  if (email?.trim()) parts.push(email.trim());

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: authTheme.surface,
        borderWidth: 1,
        borderColor: authTheme.cardBorder,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 11,
          color: authTheme.textDim,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        Registered account
      </Text>
      <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.text, lineHeight: 20 }}>
        {parts.join('  ·  ')}
      </Text>
    </View>
  );
}
