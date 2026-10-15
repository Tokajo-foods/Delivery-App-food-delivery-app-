import { Text, View } from 'react-native';

import { earningsStyles as styles } from '@/components/delivery/earnings/earnings-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { WalletTransaction } from '@/lib/delivery-partner/finance-types';
import {
  passbookAmount,
  passbookTitle,
  passbookTripLabel,
  passbookWhen,
} from '@/lib/delivery-partner/passbook';

/** One paid trip from GET /partners/me/wallet/transactions?type=delivery_credit. */
export function PassbookRow({ row, first }: { row: WalletTransaction; first: boolean }) {
  const money = (n: number) => formatCurrency(n, row.currency);
  const tip = row.breakdown?.tip ?? 0;
  const sub = [row.restaurantName, passbookWhen(row.createdAt)].filter(Boolean).join(' · ');
  const type = tip > 0 ? `${passbookTripLabel(row)} · incl. ${money(tip)} tip` : passbookTripLabel(row);

  return (
    <View style={styles.row}>
      <View style={[styles.rowInner, !first && styles.rowDivider]}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {passbookTitle(row)}
          </Text>
          {sub ? (
            <Text style={styles.rowSub} numberOfLines={1}>
              {sub}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowRight}>
          <Text style={styles.rowAmount}>{money(passbookAmount(row))}</Text>
          <Text style={styles.rowType}>{type}</Text>
        </View>
      </View>
    </View>
  );
}
