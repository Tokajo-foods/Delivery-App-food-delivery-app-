import { Banknote } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { overviewStyles as styles } from '@/components/delivery/earnings/earnings-overview-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { CodPending } from '@/lib/delivery-partner/finance-types';

type Props = {
  currency: string;
  pending?: CodPending;
  cashInHand: number;
  error: string | null;
  onRetry: () => void;
  onDeposit: () => void;
  onHistory: () => void;
};

export function EarningsCodSummary({
  currency,
  pending,
  cashInHand,
  error,
  onRetry,
  onDeposit,
  onHistory,
}: Props) {
  const limit = pending?.limit ?? 0;
  const pct = limit > 0 ? Math.min(100, (cashInHand / limit) * 100) : 0;
  const fillColor = pct >= 100 ? '#DC2626' : pct >= 75 ? '#F59E0B' : '#16A34A';

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: '#ECFDF3' }]}>
          <Banknote color="#15803D" size={18} />
        </View>
        <Text style={styles.cardTitle}>Cash on delivery</Text>
        <Pressable onPress={onDeposit} hitSlop={8}>
          <Text style={styles.link}>Deposit</Text>
        </Pressable>
      </View>

      {error ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.caption}>{error} Tap to retry.</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Cash in hand</Text>
              <Text style={styles.statValue}>{formatCurrency(cashInHand, currency)}</Text>
              <Text style={styles.statMeta}>to deposit</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Collected today</Text>
              <Text style={styles.statValue}>
                {formatCurrency(pending?.todayCollected ?? 0, currency)}
              </Text>
              <Text style={styles.statMeta}>{pending?.todayCount ?? 0} COD orders</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Deposited</Text>
              <Text style={styles.statValue}>
                {formatCurrency(pending?.remittedLifetime ?? 0, currency)}
              </Text>
              <Text style={styles.statMeta}>lifetime</Text>
            </View>
          </View>

          {limit > 0 ? (
            <View style={{ gap: 6 }}>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor }]} />
              </View>
              <View style={styles.trackCaption}>
                <Text style={styles.caption}>
                  {formatCurrency(cashInHand, currency)} of {formatCurrency(limit, currency)} limit
                </Text>
                <Pressable onPress={onHistory} hitSlop={8}>
                  <Text style={[styles.caption, { color: '#EA4B14' }]}>Deposit history</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {pending?.blocked || pending?.remitDueToday ? (
            <View style={styles.warn}>
              <Text style={styles.warnText}>
                {pending?.blocked
                  ? 'COD limit reached. Deposit cash to receive new cash orders.'
                  : 'You are close to the COD limit. Deposit cash today.'}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
