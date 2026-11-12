import { CheckCircle2 } from 'lucide-react-native';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
};

/** Short-lived centered confirmation — use ~2–3s before navigation. */
export function AuthBriefToast({ visible, title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={[styles.backdrop, { paddingTop: insets.top + 24 }]}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <CheckCircle2 size={26} color={authTheme.success} strokeWidth={2.25} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: authTheme.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: authTheme.text,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    color: authTheme.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
