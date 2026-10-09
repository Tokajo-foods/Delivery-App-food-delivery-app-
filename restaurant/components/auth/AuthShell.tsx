import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthSlideSheet } from '@/components/auth/AuthSlideSheet';
import { cardShadow, theme } from '@/constants/theme';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  onBackPress?: () => void;
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showBack,
  onBackPress,
}: AuthShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetMaxHeight = Math.round(height * 0.78);

  return (
    <View className="flex-1 bg-transparent">
      <AuthSlideSheet onDismissed={() => router.replace('/')}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: sheetMaxHeight }}
        >
          <View
            className="rounded-t-[32px] bg-white px-6 pt-5"
            style={[
              cardShadow,
              { paddingBottom: Math.max(insets.bottom, 16) + 12 },
            ]}
          >
            {showBack ? (
              <Pressable
                onPress={onBackPress ?? (() => router.back())}
                hitSlop={10}
                className="mb-4 h-9 w-9 items-center justify-center rounded-full bg-surface"
              >
                <ArrowLeft color={theme.secondary} size={18} />
              </Pressable>
            ) : null}

            <Text className="text-2xl font-extrabold text-secondary">
              {title}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-secondary-light">
              {subtitle}
            </Text>

            <View className="mt-6">{children}</View>

            {footer ? <View className="mt-6">{footer}</View> : null}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </AuthSlideSheet>
    </View>
  );
}
