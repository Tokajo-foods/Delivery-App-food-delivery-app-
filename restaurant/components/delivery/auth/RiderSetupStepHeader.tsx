import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
};

export function RiderSetupStepHeader({ icon: Icon, title, subtitle }: Props) {
  return (
    <View style={{ gap: 8, marginBottom: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: authTheme.surface,
            borderWidth: 1,
            borderColor: authTheme.cardBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={authTheme.text} strokeWidth={2} />
        </View>
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.bold,
            fontSize: 17,
            color: authTheme.text,
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 13,
            lineHeight: 19,
            color: authTheme.textMuted,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
