import { Text, View } from 'react-native';

import { PeriodStats } from '@/components/delivery/earnings/PeriodStats';
import { SectionState } from '@/components/delivery/earnings/SectionState';
import { earningsStyles as styles } from '@/components/delivery/earnings/earnings-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { CodPeriodTotal, CodPeriods } from '@/lib/delivery-partner/cod-periods';

type Props = {
  currency: string;
  periods: CodPeriods | null;
  cashInHand?: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function cell(label: string, total: CodPeriodTotal, currency: string) {
  return {
    label,
    value: formatCurrency(total.amount, currency),
    meta: `${total.orders} ${total.orders === 1 ? 'order' : 'orders'}`,
  };
}

/** Cash taken from customers on COD orders (daily ledger) + cash still held (GET /cod/pending). */
export function CodCollectedCard({ currency, periods, cashInHand, loading, error, onRetry }: Props) {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardTitle}>COD collected</Text>
        <Text style={styles.cardSub}>Cash collected from customers</Text>
      </View>
      {loading ? (
        <SectionState kind="loading" />
      ) : error || !periods ? (
        <SectionState kind="error" message={error ?? 'Could not load COD.'} onRetry={onRetry} />
      ) : (
        <PeriodStats
          items={[
            cell('Today', periods.today, currency),
            cell('This week', periods.week, currency),
            cell('This month', periods.month, currency),
          ]}
        />
      )}
      {cashInHand != null ? (
        <View style={styles.footRow}>
          <Text style={styles.footLabel}>Cash in hand now</Text>
          <Text style={styles.footValue}>{formatCurrency(cashInHand, currency)}</Text>
        </View>
      ) : null}
    </View>
  );
}
