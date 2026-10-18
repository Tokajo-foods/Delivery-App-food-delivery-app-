import { BookOpenText, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { EarningsPeriodTotals } from '@/lib/restaurant/earnings-types';

type Tone = 'plus' | 'minus' | 'neutral';

function Line({ label, hint, value, tone }: { label: string; hint?: string; value: string; tone: Tone }) {
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
  commissionPercent,
  onOpenPassbook,
}: {
  totals: EarningsPeriodTotals;
  commissionPercent?: number;
  onOpenPassbook: () => void;
}) {
  const delivered = totals.deliveredOrders;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Settlement breakdown</Text>

      <Line
        label="Food sales"
        hint={`${delivered} delivered ${delivered === 1 ? 'order' : 'orders'}`}
        value={formatCurrency(totals.grossSales)}
        tone="neutral"
      />
      <Line
        label={`Platform fee${commissionPercent ? ` · ${commissionPercent}%` : ''}`}
        value={`−${formatCurrency(totals.commission)}`}
        tone="minus"
      />
      {totals.returnedOrders > 0 ? (
        <Line
          label="RTO food credit"
          hint={`${totals.returnedOrders} returned`}
          value={`+${formatCurrency(totals.returnedEarnings)}`}
          tone="plus"
        />
      ) : null}
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

      <Pressable
        onPress={onOpenPassbook}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
      >
        <BookOpenText color={authTheme.brand} size={16} strokeWidth={2.4} />
        <Text style={styles.ctaText}>View every entry in passbook</Text>
        <ChevronRight color={authTheme.brand} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
    gap: 12,
  },
  title: { fontFamily: fonts.bold, fontSize: 15, color: authTheme.text },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  lineCopy: { flex: 1, gap: 1 },
  lineLabel: { fontFamily: fonts.semiBold, fontSize: 13.5, color: authTheme.text },
  lineHint: { fontFamily: fonts.medium, fontSize: 11.5, color: authTheme.textDim },
  lineValue: { fontFamily: fonts.bold, fontSize: 14, color: authTheme.text },
  minus: { color: '#B91C1C' },
  plus: { color: '#15803D' },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: authTheme.cardBorder,
  },
  totalLabel: { fontFamily: fonts.extraBold, fontSize: 15, color: authTheme.text },
  totalValue: { fontFamily: fonts.extraBold, fontSize: 18, color: authTheme.brand, letterSpacing: -0.3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: authTheme.brandSoft,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  ctaPressed: { backgroundColor: authTheme.brandMuted },
  ctaText: { flex: 1, fontFamily: fonts.bold, fontSize: 13, color: authTheme.brand },
});
