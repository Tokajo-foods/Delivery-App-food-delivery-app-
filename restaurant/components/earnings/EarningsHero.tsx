import { RotateCcw } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { EarningsPeriodTotals } from '@/lib/restaurant/earnings-types';

import { PERIOD_LABELS, periodRangeLabel } from './earnings-format';

type Props = {
  totals?: EarningsPeriodTotals;
  balance?: number;
  commissionPercent?: number;
  loading: boolean;
  refreshing: boolean;
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'minus' }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, tone === 'minus' && styles.statMinus]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function signed(amount: number): string {
  if (amount === 0) return formatCurrency(0);
  return `${amount > 0 ? '+' : '−'}${formatCurrency(Math.abs(amount))}`;
}

export function EarningsHero({ totals, balance, commissionPercent, loading, refreshing }: Props) {
  const period = totals?.period ?? 'today';
  const orders = totals?.orders ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Net earnings · {PERIOD_LABELS[period]}</Text>
        {refreshing ? <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" /> : null}
      </View>
      {loading && !totals ? (
        <ActivityIndicator color="#FFFFFF" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.amount}>{formatCurrency(totals?.netEarnings ?? 0)}</Text>
          <Text style={styles.sub}>
            {orders} {orders === 1 ? 'order' : 'orders'} ·{' '}
            {periodRangeLabel(period, totals?.from ?? '')}
          </Text>

          <View style={styles.statsRow}>
            <Stat label="Food sales" value={formatCurrency(totals?.grossSales ?? 0)} />
            <Stat
              label={`Platform fee${commissionPercent ? ` (${commissionPercent}%)` : ''}`}
              value={`−${formatCurrency(totals?.commission ?? 0)}`}
              tone="minus"
            />
            <Stat label="Adjustments" value={signed(totals?.adjustments ?? 0)} />
          </View>

          {totals && totals.returnedOrders > 0 ? (
            <View style={styles.note}>
              <RotateCcw color="#FDE68A" size={13} />
              <Text style={styles.noteText}>
                Includes {formatCurrency(totals.returnedEarnings)} for {totals.returnedOrders}{' '}
                returned {totals.returnedOrders === 1 ? 'order' : 'orders'} (RTO food credit)
              </Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Wallet balance <Text style={styles.footerStrong}>{formatCurrency(balance ?? 0)}</Text>
            </Text>
            <Text style={styles.footerText}>
              Paid to bank{' '}
              <Text style={styles.footerStrong}>{formatCurrency(totals?.payouts ?? 0)}</Text>
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#14532D',
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loader: { paddingVertical: 28 },
  amount: { fontFamily: fonts.extraBold, fontSize: 34, color: '#FFFFFF', letterSpacing: -0.5 },
  sub: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  statLabel: { fontFamily: fonts.medium, fontSize: 10.5, color: 'rgba(255,255,255,0.7)' },
  statValue: { fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' },
  statMinus: { color: '#FECACA' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  noteText: { flex: 1, fontFamily: fonts.medium, fontSize: 11.5, color: '#FDE68A' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  footerText: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  footerStrong: { fontFamily: fonts.bold, color: '#FFFFFF' },
});
