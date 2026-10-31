import { Bike, Landmark, RotateCcw, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { EarningsPeriod, EarningsPeriodTotals } from '@/lib/restaurant/earnings-types';

import { DELTA_LABELS, PERIOD_LABELS, periodRangeLabel } from './earnings-format';

type Props = {
  period: EarningsPeriod;
  totals?: EarningsPeriodTotals;
  balance?: number;
  settled?: number;
  canWithdraw?: boolean;
  onWithdraw?: () => void;
  deltaPercent: number | null;
  loading: boolean;
  refreshing: boolean;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function EarningsHero({
  period,
  totals,
  balance,
  settled,
  canWithdraw,
  onWithdraw,
  deltaPercent,
  loading,
  refreshing,
}: Props) {
  const orders = totals?.orders ?? 0;
  const avg = orders > 0 ? (totals?.netEarnings ?? 0) / orders : 0;
  const up = (deltaPercent ?? 0) >= 0;
  const DeltaIcon = up ? TrendingUp : TrendingDown;
  const pct =
    deltaPercent == null
      ? null
      : Math.abs(deltaPercent) >= 100
        ? Math.round(Math.abs(deltaPercent))
        : +Math.abs(deltaPercent).toFixed(1);

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>Net earnings · {PERIOD_LABELS[period]}</Text>
          {refreshing ? <ActivityIndicator size="small" color={authTheme.brand} /> : null}
        </View>
        {loading && !totals ? (
          <ActivityIndicator color={authTheme.brand} style={styles.loader} />
        ) : (
          <>
            <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(totals?.netEarnings ?? 0)}
            </Text>
            <View style={styles.meta}>
              {pct != null ? (
                <View style={styles.delta}>
                  <DeltaIcon color={up ? '#15803D' : '#B91C1C'} size={13} strokeWidth={2.4} />
                  <Text style={[styles.deltaText, { color: up ? '#15803D' : '#B91C1C' }]}>
                    {up ? '+' : '−'}
                    {pct}% {DELTA_LABELS[period]}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.range} numberOfLines={1}>
                {pct != null ? ' · ' : ''}
                {periodRangeLabel(period, totals?.from ?? '')}
              </Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.rule} />

      <View style={styles.row}>
        <Stat label={orders === 1 ? 'Order' : 'Orders'} value={String(orders)} />
        <View style={styles.divider} />
        <Stat label="Avg / order" value={formatCurrency(avg)} />
        <View style={styles.divider} />
        <Stat label="Food sales" value={formatCurrency(totals?.grossSales ?? 0)} />
      </View>

      {totals && totals.returnedOrders > 0 ? (
        <View style={styles.note}>
          <RotateCcw color="#B45309" size={13} />
          <Text style={styles.noteText}>
            Includes {formatCurrency(totals.returnedEarnings)} RTO food credit · {totals.returnedOrders}{' '}
            returned
          </Text>
        </View>
      ) : null}
      {totals && totals.noRiderOrders > 0 ? (
        <View style={styles.note}>
          <Bike color="#B45309" size={13} />
          <Text style={styles.noteText}>
            Includes {formatCurrency(totals.noRiderEarnings)} for {totals.noRiderOrders} cancelled ·
            no rider (food was ready)
          </Text>
        </View>
      ) : null}

      <View style={styles.rule} />

      <View style={styles.walletRow}>
        <View style={styles.walletCol}>
          <View style={styles.walletHead}>
            <Wallet color={authTheme.brand} size={14} strokeWidth={2.2} />
            <Text style={styles.walletLabel}>Remaining</Text>
          </View>
          <Text style={styles.walletValue}>{formatCurrency(balance ?? 0)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.walletCol}>
          <View style={styles.walletHead}>
            <Landmark color="#1D4ED8" size={14} strokeWidth={2.2} />
            <Text style={styles.walletLabel}>Settled</Text>
          </View>
          <Text style={styles.walletValue}>{formatCurrency(settled ?? 0)}</Text>
        </View>
      </View>
      {onWithdraw ? (
        <Pressable
          disabled={!canWithdraw}
          onPress={onWithdraw}
          style={[styles.withdraw, !canWithdraw && styles.withdrawOff]}
        >
          <Text style={styles.withdrawText}>Request earnings</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  top: { gap: 4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontFamily: fonts.semiBold, fontSize: 13, color: '#1C1917' },
  loader: { paddingVertical: 22 },
  amount: {
    color: '#EA4B14',
    fontSize: 32,
    fontFamily: fonts.extraBold,
    letterSpacing: -0.8,
  },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deltaText: { fontFamily: fonts.semiBold, fontSize: 12.5 },
  range: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12.5, color: authTheme.textMuted },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D6D3D1',
    marginVertical: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  statValue: { fontFamily: fonts.extraBold, fontSize: 16, color: authTheme.text, letterSpacing: -0.3 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  divider: { width: 1, height: 28, backgroundColor: '#D6D3D1' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteText: { flex: 1, fontFamily: fonts.medium, fontSize: 12, color: '#92400E' },
  walletRow: { flexDirection: 'row', alignItems: 'center' },
  walletCol: { flex: 1, alignItems: 'center', gap: 3 },
  walletHead: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletLabel: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  walletValue: { fontFamily: fonts.extraBold, fontSize: 16, color: authTheme.text, letterSpacing: -0.3 },
  withdraw: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
    paddingVertical: 12,
    alignItems: 'center',
  },
  withdrawOff: { opacity: 0.4 },
  withdrawText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' },
});
