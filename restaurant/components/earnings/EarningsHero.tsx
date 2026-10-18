import { LinearGradient } from 'expo-linear-gradient';
import { Landmark, RotateCcw, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { EarningsPeriod, EarningsPeriodTotals } from '@/lib/restaurant/earnings-types';

import { HeroPeriodPills } from './EarningsControls';
import { DELTA_LABELS, periodRangeLabel } from './earnings-format';

type Props = {
  period: EarningsPeriod;
  onPeriodChange: (next: EarningsPeriod) => void;
  totals?: EarningsPeriodTotals;
  balance?: number;
  deltaPercent: number | null;
  loading: boolean;
  refreshing: boolean;
};

function DeltaBadge({ value, period }: { value: number; period: EarningsPeriod }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const pct = Math.abs(value) >= 100 ? Math.round(Math.abs(value)) : +Math.abs(value).toFixed(1);
  return (
    <View style={styles.delta}>
      <Icon color={up ? '#15803D' : '#B91C1C'} size={13} strokeWidth={2.6} />
      <Text style={[styles.deltaText, { color: up ? '#15803D' : '#B91C1C' }]}>
        {up ? '+' : '−'}
        {pct}%
      </Text>
      <Text style={styles.deltaHint}>{DELTA_LABELS[period]}</Text>
    </View>
  );
}

export function EarningsHero({
  period,
  onPeriodChange,
  totals,
  balance,
  deltaPercent,
  loading,
  refreshing,
}: Props) {
  const orders = totals?.orders ?? 0;
  const avg = orders > 0 ? (totals?.netEarnings ?? 0) / orders : 0;

  return (
    <LinearGradient
      colors={['#C23D0F', '#EA4B14', '#FF7A3D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={[styles.orb, styles.orbLarge]} />
      <View style={[styles.orb, styles.orbSmall]} />

      <HeroPeriodPills value={period} onChange={onPeriodChange} />

      <View style={styles.topRow}>
        <Text style={styles.eyebrow}>Net earnings</Text>
        {refreshing ? <ActivityIndicator size="small" color="rgba(255,255,255,0.85)" /> : null}
      </View>

      {loading && !totals ? (
        <ActivityIndicator color="#FFFFFF" style={styles.loader} />
      ) : (
        <>
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(totals?.netEarnings ?? 0)}
          </Text>
          <View style={styles.metaRow}>
            {deltaPercent != null ? <DeltaBadge value={deltaPercent} period={period} /> : null}
            <Text style={styles.sub} numberOfLines={1}>
              {periodRangeLabel(period, totals?.from ?? '')}
            </Text>
          </View>

          <View style={styles.kpis}>
            <View style={styles.kpi}>
              <Text style={styles.kpiValue}>{orders}</Text>
              <Text style={styles.kpiLabel}>{orders === 1 ? 'Order' : 'Orders'}</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpi}>
              <Text style={styles.kpiValue} numberOfLines={1}>{formatCurrency(avg)}</Text>
              <Text style={styles.kpiLabel}>Avg / order</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpi}>
              <Text style={styles.kpiValue} numberOfLines={1}>{formatCurrency(totals?.grossSales ?? 0)}</Text>
              <Text style={styles.kpiLabel}>Food sales</Text>
            </View>
          </View>

          {totals && totals.returnedOrders > 0 ? (
            <View style={styles.note}>
              <RotateCcw color="#FFF7ED" size={13} />
              <Text style={styles.noteText}>
                Includes {formatCurrency(totals.returnedEarnings)} RTO food credit for{' '}
                {totals.returnedOrders} returned {totals.returnedOrders === 1 ? 'order' : 'orders'}
              </Text>
            </View>
          ) : null}

          <View style={styles.wallet}>
            <View style={styles.walletCol}>
              <View style={styles.walletHead}>
                <Wallet color="#EA4B14" size={14} strokeWidth={2.4} />
                <Text style={styles.walletLabel}>Wallet balance</Text>
              </View>
              <Text style={styles.walletValue}>{formatCurrency(balance ?? 0)}</Text>
            </View>
            <View style={styles.walletDivider} />
            <View style={styles.walletCol}>
              <View style={styles.walletHead}>
                <Landmark color="#1D4ED8" size={14} strokeWidth={2.4} />
                <Text style={styles.walletLabel}>Paid to bank</Text>
              </View>
              <Text style={styles.walletValue}>{formatCurrency(totals?.payouts ?? 0)}</Text>
            </View>
          </View>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    gap: 8,
    overflow: 'hidden',
    shadowColor: '#C23D0F',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)' },
  orbLarge: { width: 220, height: 220, top: -90, right: -70 },
  orbSmall: { width: 120, height: 120, bottom: 70, left: -50 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loader: { paddingVertical: 36 },
  amount: { fontFamily: fonts.extraBold, fontSize: 38, color: '#FFFFFF', letterSpacing: -1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  delta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deltaText: { fontFamily: fonts.bold, fontSize: 12 },
  deltaHint: { fontFamily: fonts.medium, fontSize: 11, color: '#64748B' },
  sub: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  kpis: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingVertical: 12,
  },
  kpi: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  kpiValue: { fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' },
  kpiLabel: { fontFamily: fonts.medium, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  kpiDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.25)' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  noteText: { flex: 1, fontFamily: fonts.medium, fontSize: 11.5, color: '#FFF7ED' },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  walletCol: { flex: 1, gap: 3 },
  walletHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: '#64748B' },
  walletValue: { fontFamily: fonts.extraBold, fontSize: 16, color: '#0F172A', letterSpacing: -0.3 },
  walletDivider: { width: 1, height: 32, backgroundColor: '#EBEBEB', marginHorizontal: 12 },
});
