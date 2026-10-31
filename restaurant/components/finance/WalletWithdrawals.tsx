import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { RestaurantPayout } from '@/lib/restaurant/finance-types';

const TONE: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: '#ECFDF5', fg: '#047857', label: 'Settled' },
  processing: { bg: '#EFF6FF', fg: '#1D4ED8', label: 'Processing' },
  pending: { bg: '#FFFBEB', fg: '#B45309', label: 'Pending' },
  failed: { bg: '#FEF2F2', fg: '#B91C1C', label: 'Failed' },
  on_hold: { bg: '#F8FAFC', fg: '#475569', label: 'On hold' },
};

function when(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WalletWithdrawals({ items }: { items: RestaurantPayout[] }) {
  if (!items.length) {
    return (
      <Text style={styles.empty}>
        No withdrawals yet. Request earnings above to send money to UPI.
      </Text>
    );
  }
  return (
    <View style={styles.list}>
      <Text style={styles.title}>Withdrawals</Text>
      {items.map((row) => {
        const tone = TONE[row.status] ?? {
          bg: authTheme.surface,
          fg: authTheme.textMuted,
          label: row.status,
        };
        return (
          <View key={row.id} style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.amount}>{formatCurrency(row.netAmount)}</Text>
              <View style={[styles.chip, { backgroundColor: tone.bg }]}>
                <Text style={[styles.chipText, { color: tone.fg }]}>{tone.label}</Text>
              </View>
            </View>
            <Text style={styles.meta}>
              {row.upiId || (row.ifscCode === 'UPI' ? 'UPI' : row.ifscCode) || 'Payout'} ·{' '}
              {when(row.paidAt || row.createdAt)}
            </Text>
            {row.failureReason ? (
              <Text style={styles.fail}>{row.failureReason}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  title: { fontFamily: fonts.semibold, fontSize: 15, color: authTheme.text },
  empty: { fontFamily: fonts.regular, fontSize: 13, color: authTheme.textMuted },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.border,
    backgroundColor: authTheme.surface,
    padding: 12,
    gap: 4,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { fontFamily: fonts.semibold, fontSize: 16, color: authTheme.text },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontFamily: fonts.medium, fontSize: 11 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: authTheme.textMuted },
  fail: { fontFamily: fonts.regular, fontSize: 12, color: '#B91C1C' },
});
