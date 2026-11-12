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
import { fonts } from '@/constants/typography';
import { cardShadow, theme } from '@/constants/theme';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  showBack?: boolean;
  onBackPress?: () => void;
  /** `sheet` = auth welcome slide-up; `fullscreen` = partner onboarding (uses full device height). */
  layout?: 'sheet' | 'fullscreen';
  /** Extra scroll padding when the fixed footer is taller than the default reserve. */
  footerScrollInset?: number;
};

function ShellHeader({
  title,
  subtitle,
  showBack,
  onBackPress,
  router,
}: {
  title: string;
  subtitle: string;
  showBack?: boolean;
  onBackPress?: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
  <>
    {showBack ? (
      <Pressable
        onPress={onBackPress ?? (() => router.back())}
        hitSlop={10}
        className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-surface"
      >
        <ArrowLeft color={theme.secondary} size={18} />
      </Pressable>
    ) : null}

    <Text
      style={{
        color: '#020617',
        fontFamily: fonts.extraBold,
        fontSize: 26,
        letterSpacing: -0.4,
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        marginTop: 6,
        color: '#64748B',
        fontFamily: fonts.medium,
        fontSize: 14,
        lineHeight: 20,
      }}
    >
      {subtitle}
    </Text>
  </>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  showBack,
  onBackPress,
  layout = 'sheet',
  footerScrollInset,
}: AuthShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetMaxHeight = Math.round(height * 0.78);

  if (layout === 'fullscreen') {
    const footerBottom = Math.max(insets.bottom, 12) + 10;
    const footerReserve = footer
      ? (footerScrollInset ?? 120) + footerBottom
      : 16;
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <ScrollView
            style={{ flex: 1, backgroundColor: '#FFFFFF' }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            contentContainerStyle={{ paddingBottom: footerReserve }}
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 24,
                paddingTop: Math.max(insets.top, 12) + 8,
              }}
            >
              <ShellHeader
                title={title}
                subtitle={subtitle}
                showBack={showBack}
                onBackPress={onBackPress}
                router={router}
              />
              <View style={{ marginTop: 24 }}>{children}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        {footer ? (
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: footerBottom,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              shadowColor: '#0f172a',
              shadowOpacity: 0.1,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
              elevation: 16,
            }}
          >
            {footer}
          </View>
        ) : null}
      </View>
    );
  }

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
            <ShellHeader
              title={title}
              subtitle={subtitle}
              showBack={showBack}
              onBackPress={onBackPress}
              router={router}
            />

            <View className="mt-6">{children}</View>

            {footer ? <View className="mt-6">{footer}</View> : null}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </AuthSlideSheet>
    </View>
  );
}
