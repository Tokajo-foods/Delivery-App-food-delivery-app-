import { User } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type PersonalForm = {
  firstName: string;
  lastName: string;
  phone: string;
};

type Props = {
  personalReady: boolean;
  form: PersonalForm;
  onPatch: (patch: Partial<PersonalForm>) => void;
};

/** Shown only when name/phone could not be loaded from the account. */
export function RiderAccountSummaryCard({ personalReady, form, onPatch }: Props) {
  if (personalReady) return null;

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: authTheme.cardBorder,
        backgroundColor: authTheme.card,
        gap: 14,
      }}
    >
      <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.text }}>
        Account details
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: authTheme.textMuted, lineHeight: 19 }}>
        Enter your name as it should appear on the partner profile.
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <AuthField
            label="First name"
            icon={User}
            placeholder="First name"
            value={form.firstName}
            onChangeText={(firstName) => onPatch({ firstName })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AuthField
            label="Last name"
            placeholder="Last name"
            value={form.lastName}
            onChangeText={(lastName) => onPatch({ lastName })}
          />
        </View>
      </View>
      <AuthField
        label="Mobile"
        placeholder="+919876543210"
        value={form.phone}
        onChangeText={(phone) => onPatch({ phone })}
      />
    </View>
  );
}
