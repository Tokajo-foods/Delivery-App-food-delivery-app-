import { StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { RestaurantWallet } from '@/lib/restaurant/finance-types';

type BankSnap = {
  accountMasked?: string;
  ifsc?: string;
  holderName?: string;
  verificationStatus?: string;
} | null;

type Props = {
  wallet?: RestaurantWallet | null;
  bank?: BankSnap;
};

/** Earned / settled / remaining — same numbers as the wallet API. */
export function SettlementSummaryStrip({
  wallet,
  bank,
}: Props) {
  if (!wallet) return null;
  const settled = wallet.settled ?? wallet.lifetimeDebited ?? 0;
  const remaining = wallet.available ?? wallet.remaining ?? wallet.balance ?? 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Earnings overview</Text>
      <Text style={styles.hint}>
        Withdraw completed earnings anytime. Delivery COD, online delivery, and
        online takeaway add to remaining. Pay-at-counter / dine-in cash is
        earned only — it is not withdrawable.
      </Text>
      <View style={styles.grid}>
        <Cell
          label="Earned (completed)"
          value={formatCurrency(wallet.lifetimeCredited)}
        />
        <Cell
          label="Collected at store"
          value={formatCurrency(wallet.collectedAtStore ?? 0)}
        />
        <Cell
          label="Taken / settled"
          value={formatCurrency(settled)}
        />
        <Cell
          label="Remaining"
          value={formatCurrency(remaining)}
        />
      </View>
      <Text style={styles.meta}>
        Remaining updates as soon as you request a withdrawal or a completed
        order is credited.
      </Text>
      {bank ? (
        <Text style={styles.meta}>
          Bank:{' '}
          {bank.holderName || 'Account'} · {bank.accountMasked || '••••'} ·{' '}
          {bank.ifsc || 'IFSC'} · {bank.verificationStatus || 'unverified'}
        </Text>
      ) : (
        <Text style={styles.meta}>Bank: add payout account in Settings</Text>
      )}
    </View>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.border,
    backgroundColor: authTheme.surface,
    padding: 14,
    gap: 8,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: authTheme.text,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 17,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cell: {
    width: '47%',
    borderRadius: 12,
    backgroundColor: authTheme.bg,
    padding: 10,
  },
  cellLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textMuted,
    textTransform: 'uppercase',
  },
  cellValue: {
    marginTop: 4,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: authTheme.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: authTheme.textMuted,
  },
});
