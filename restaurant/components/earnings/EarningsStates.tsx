import { AlertTriangle, ReceiptText } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export function EarningsError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorHead}>
        <AlertTriangle color={authTheme.error} size={18} />
        <Text style={styles.errorTitle}>Couldn’t load earnings</Text>
      </View>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable style={styles.retry} onPress={onRetry} accessibilityRole="button">
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

export function PassbookEmpty({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <ReceiptText color={authTheme.textDim} size={26} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyHint}>{hint}</Text>
    </View>
  );
}

export function PassbookDayHeader({ label }: { label: string }) {
  return (
    <View style={styles.dayHeader}>
      <Text style={styles.dayText}>{label}</Text>
    </View>
  );
}

export function PassbookFooter({
  loadingMore,
  done,
  count,
}: {
  loadingMore: boolean;
  done: boolean;
  count: number;
}) {
  if (loadingMore) return <ActivityIndicator style={styles.footer} color={authTheme.brand} />;
  if (done && count > 0) {
    return <Text style={[styles.footer, styles.footerText]}>End of passbook · {count} entries</Text>;
  }
  return <View style={styles.footer} />;
}

const styles = StyleSheet.create({
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 16,
    gap: 8,
  },
  errorHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorTitle: { fontFamily: fonts.bold, fontSize: 15, color: authTheme.text },
  errorText: { fontFamily: fonts.medium, fontSize: 13, color: authTheme.textMuted, lineHeight: 18 },
  retry: {
    alignSelf: 'flex-start',
    backgroundColor: authTheme.brand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryText: { fontFamily: fonts.bold, fontSize: 13, color: '#FFFFFF' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 15, color: authTheme.text, textAlign: 'center' },
  emptyHint: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: authTheme.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  dayHeader: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6, backgroundColor: '#F8FAFC' },
  dayText: {
    fontFamily: fonts.bold,
    fontSize: 11.5,
    color: authTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  footer: { paddingVertical: 18 },
  footerText: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textDim,
  },
});
