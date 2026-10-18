import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { EarningsPeriodTotals } from '@/lib/restaurant/earnings-types';

type Tone = 'plus' | 'minus' | 'neutral';

function Line({
  label,
  hint,
  value,
  tone,
}: {
  label: string;
  hint?: string;
  value: string;
  tone: Tone;
}) {
  return (
    <View style={styles.line}>
      <View style={styles.lineCopy}>
        <Text style={styles.lineLabel}>{label}</Text>
        {hint ? <Text style={styles.lineHint}>{hint}</Text> : null}
      </View>
      <Text style={[styles.lineValue, tone === 'minus' && styles.minus, tone === 'plus' && styles.plus]}>
        {value}
      </Text>
    </View>
  );
}

function signed(amount: number): string {
  if (amount === 0) return formatCurrency(0);
  return `${amount > 0 ? '+' : '−'}${formatCurrency(Math.abs(amount))}`;
}

export function EarningsBreakdown({
  totals,
}: {
  totals: EarningsPeriodTotals;
}) {
  const commissionPercent = totals.commissionPercent;
  const salesHint = [
    `${totals.deliveredOrders} delivered`,
    totals.returnedOrders > 0 ? `${totals.returnedOrders} returned (RTO)` : null,
    totals.noRiderOrders > 0 ? `${totals.noRiderOrders} cancelled · no rider` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Settlement</Text>
      <Line
        label="Food sales"
        hint={salesHint}
        value={formatCurrency(totals.grossSales)}
        tone="neutral"
      />
      <Line
        label="Platform fee"
        hint={commissionPercent ? `${commissionPercent}% commission` : undefined}
        value={`−${formatCurrency(totals.commission)}`}
        tone="minus"
      />
      <Line
        label="Adjustments"
        hint={totals.adjustmentCount ? `${totals.adjustmentCount} entries` : undefined}
        value={signed(totals.adjustments)}
        tone={totals.adjustments < 0 ? 'minus' : totals.adjustments > 0 ? 'plus' : 'neutral'}
      />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Net earnings</Text>
        <Text style={styles.totalValue}>{formatCurrency(totals.netEarnings)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    padding: 18,
    gap: 14,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  title: { fontFamily: fonts.semiBold, fontSize: 13, color: '#1C1917' },
  line: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  lineCopy: { flex: 1, gap: 2 },
  lineLabel: { fontFamily: fonts.medium, fontSize: 14, color: authTheme.text },
  lineHint: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textDim },
  lineValue: { fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.text },
  minus: { color: '#B91C1C' },
  plus: { color: '#15803D' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D6D3D1',
  },
  totalLabel: { fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.text },
  totalValue: { fontFamily: fonts.extraBold, fontSize: 18, color: '#EA4B14', letterSpacing: -0.4 },
});
