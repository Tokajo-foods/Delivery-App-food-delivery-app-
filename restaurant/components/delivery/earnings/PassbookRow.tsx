import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Gift,
  Landmark,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react-native';
import { Text, View } from 'react-native';

import { passbookStyles as styles } from '@/components/delivery/earnings/passbook-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { WalletTransaction } from '@/lib/delivery-partner/finance-types';
import {
  passbookAmount,
  passbookKind,
  passbookSubtitle,
  passbookTitle,
  timeLabel,
  type PassbookKind,
} from '@/lib/delivery-partner/passbook';

const TONE: Record<PassbookKind, { bg: string; fg: string; sign: string; tag?: string }> = {
  earning: { bg: '#ECFDF3', fg: '#15803D', sign: '+' },
  debit: { bg: '#FEF2F2', fg: '#B91C1C', sign: '−' },
  cash_in: { bg: '#FFFBEB', fg: '#B45309', sign: '', tag: 'Cash in hand' },
  cash_out: { bg: '#EFF6FF', fg: '#1D4ED8', sign: '', tag: 'Deposited' },
};

function iconFor(row: WalletTransaction, kind: PassbookKind): LucideIcon {
  if (row.tripKind === 'return') return RotateCcw;
  if (kind === 'cash_in') return Banknote;
  if (kind === 'cash_out') return Landmark;
  if (row.type === 'incentive_credit' || row.type === 'referral_credit') return Gift;
  return kind === 'debit' ? ArrowUpRight : ArrowDownLeft;
}

export function PassbookRow({ row, first }: { row: WalletTransaction; first: boolean }) {
  const kind = passbookKind(row);
  const tone = TONE[kind];
  const Icon = iconFor(row, kind);
  const money = (n: number) => formatCurrency(n, row.currency);
  const subtitle = passbookSubtitle(row, money);
  const failed = row.type === 'payout_debit' && (row.status ?? '').toLowerCase() === 'failed';

  return (
    <View style={[styles.row, !first && styles.rowDivider]}>
      <View style={[styles.icon, { backgroundColor: tone.bg }]}>
        <Icon color={tone.fg} size={19} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {passbookTitle(row)}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSub} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={styles.rowTime}>{timeLabel(row.createdAt)}</Text>
      </View>
      <View style={styles.amountCol}>
        <Text
          style={[
            styles.amount,
            { color: failed ? '#94A3B8' : tone.fg },
            failed && { textDecorationLine: 'line-through' },
          ]}
        >
          {tone.sign}
          {money(passbookAmount(row))}
        </Text>
        {tone.tag ? (
          <View style={[styles.tag, { backgroundColor: tone.bg }]}>
            <Text style={[styles.tagText, { color: tone.fg }]}>{tone.tag}</Text>
          </View>
        ) : row.tripKind === 'return' ? (
          <View style={[styles.tag, { backgroundColor: tone.bg }]}>
            <Text style={[styles.tagText, { color: tone.fg }]}>Returned</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
