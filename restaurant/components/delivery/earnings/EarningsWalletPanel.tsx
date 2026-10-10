import { Clock, HelpCircle, Zap } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AnalyticsTrendChart } from '@/components/delivery/analytics/AnalyticsTrendChart';
import { earningsPageStyles as styles } from '@/components/delivery/earnings/earnings-page-styles';
import { authTheme } from '@/constants/auth-theme';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import { EarningsIncentiveRow } from '@/components/delivery/earnings/EarningsIncentiveRow';
import type {
  EarningsPeriod,
  EarningsPeriodKey,
  PartnerDailyEarning,
  PartnerIncentive,
} from '@/lib/delivery-partner/analytics-types';
import { bankStatusLabel, isBankVerified } from '@/lib/delivery-partner/bank-types';
import type { PartnerBank } from '@/lib/delivery-partner/bank-types';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

const PERIODS: { key: EarningsPeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'lifetime', label: 'All' },
];

type PayoutHint = {
  bankAccountNo?: string;
  ifscCode?: string;
  accountHolderName?: string;
};

export function EarningsWalletPanel({
  currency,
  payable,
  cashDue,
  lifetime,
  pendingPayouts,
  settled,
  nextDue,
  period,
  onPeriod,
  selected,
  chartPoints,
  hasChart,
  earningsError,
  onRetryEarnings,
  scheduleError,
  onRetrySchedule,
  scheduleLine,
  feeLine,
  incentiveRows,
  incentivesError,
  bank,
  bankError,
  payout,
  hasPayout,
  codBlocked,
  codLimit,
  remitDue,
  onWithdraw,
  onRemit,
  onHistory,
}: {
  currency: string;
  payable: number;
  cashDue: number;
  lifetime: number;
  pendingPayouts: number;
  settled: number;
  nextDue: string;
  period: EarningsPeriodKey;
  onPeriod: (key: EarningsPeriodKey) => void;
  selected: EarningsPeriod;
  chartPoints: PartnerDailyEarning[];
  hasChart: boolean;
  earningsError: string | null;
  onRetryEarnings: () => void;
  scheduleError: string | null;
  onRetrySchedule: () => void;
  scheduleLine: string | null;
  feeLine: string | null;
  incentiveRows: PartnerIncentive[];
  incentivesError: boolean;
  bank?: PartnerBank | null;
  bankError: boolean;
  payout?: PayoutHint;
  hasPayout: boolean;
  codBlocked: boolean;
  codLimit: number;
  remitDue: boolean;
  onWithdraw: () => void;
  onRemit: () => void;
  onHistory: () => void;
}) {
  const router = useRouter();
  const cells: { label: string; value: string; negative?: boolean }[] = [
    { label: 'Base pay', value: formatCurrency(selected.baseEarnings, currency) },
    { label: 'Incentives', value: formatCurrency(selected.incentives, currency) },
    { label: 'Tips', value: formatCurrency(selected.tips, currency) },
    {
      label: 'Deductions',
      value:
        selected.deductions > 0
          ? `−${formatCurrency(selected.deductions, currency)}`
          : formatCurrency(0, currency),
      negative: selected.deductions > 0,
    },
  ];
  const verified = isBankVerified(bank);
  const masked =
    bank?.accountMasked ||
    (payout?.bankAccountNo ? `····${String(payout.bankAccountNo).slice(-4)}` : '—');

  return (
    <>
      <View style={styles.pair}>
        <View style={styles.pairCard}>
          <Text style={styles.kicker}>PAYABLE</Text>
          <Text style={styles.pairAmount}>{formatCurrency(payable, currency)}</Text>
          <Pressable onPress={onWithdraw} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Withdraw</Text>
          </Pressable>
        </View>
        <View style={styles.pairCard}>
          <Text style={styles.kicker}>COD IN HAND</Text>
          <Text style={styles.pairAmount}>{formatCurrency(cashDue, currency)}</Text>
          <Pressable onPress={onRemit} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>Remit</Text>
          </Pressable>
        </View>
      </View>

      {pendingPayouts > 0 ? (
        <Text style={styles.muted}>
          In flight {formatCurrency(pendingPayouts, currency)} · lifetime{' '}
          {formatCurrency(lifetime, currency)}
        </Text>
      ) : null}

      {codBlocked || remitDue ? (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            {codBlocked
              ? `COD cap reached (${formatCurrency(cashDue, currency)} / ${formatCurrency(codLimit, currency)}). Remit before taking more cash orders.`
              : 'Remit cash today so you stay under the COD cap.'}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={onWithdraw} style={styles.action}>
          <Zap color={authTheme.brand} size={18} />
          <Text style={styles.actionText}>Instant</Text>
        </Pressable>
        <Pressable onPress={onHistory} style={styles.action}>
          <Clock color={authTheme.brand} size={18} />
          <Text style={styles.actionText}>History</Text>
        </Pressable>
        <Pressable onPress={() => router.push(DELIVERY_ROUTES.support)} style={styles.action}>
          <HelpCircle color={authTheme.brand} size={18} />
          <Text style={styles.actionText}>Support</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This period</Text>
        <View style={styles.segment}>
          {PERIODS.map((item) => {
            const on = period === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => onPeriod(item.key)}
                style={[styles.segmentBtn, on && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {earningsError ? (
          <Pressable onPress={onRetryEarnings}>
            <Text style={styles.muted}>{earningsError}</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.heroAmount}>
              {formatCurrency(selected.totalEarnings, currency)}
            </Text>
            <Text style={styles.muted}>
              {selected.totalDeliveries} trips
              {selected.from ? ` · ${selected.from}` : ''}
              {selected.to && selected.to !== selected.from ? ` – ${selected.to}` : ''}
            </Text>
          </>
        )}
        <View style={styles.grid}>
          {cells.map((cell) => (
            <View key={cell.label} style={styles.cell}>
              <Text style={[styles.cellValue, cell.negative && styles.negative]}>
                {cell.value}
              </Text>
              <Text style={styles.cellLabel}>{cell.label}</Text>
            </View>
          ))}
        </View>
        {hasChart ? (
          <AnalyticsTrendChart points={chartPoints} />
        ) : (
          <Text style={styles.empty}>No earnings in this period.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settlement</Text>
        <Text style={styles.muted}>
          Trip pay clears after a 15-day hold. This balance matches the admin desk.
        </Text>
        <Text style={styles.rowMeta}>Lifetime {formatCurrency(lifetime, currency)}</Text>
        <Text style={styles.rowMeta}>Settled {formatCurrency(settled, currency)}</Text>
        <Text style={styles.rowMeta}>Payable {formatCurrency(payable, currency)}</Text>
        <Text style={styles.rowMeta}>Next due {nextDue}</Text>
        <Text style={styles.rowMeta}>
          Bank{' '}
          {bank
            ? `${bankStatusLabel(bank.verificationStatus)} · ${masked}`
            : 'Add a bank account in Profile'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly payout</Text>
        {scheduleError ? (
          <Pressable onPress={onRetrySchedule}>
            <Text style={styles.muted}>{scheduleError}</Text>
          </Pressable>
        ) : scheduleLine ? (
          <>
            <Text style={styles.muted}>{scheduleLine}</Text>
            {feeLine ? <Text style={styles.muted}>{feeLine}</Text> : null}
          </>
        ) : (
          <Text style={styles.empty}>Schedule is not available yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Incentives</Text>
          <Pressable onPress={() => router.push(DELIVERY_ROUTES.incentives)}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {incentivesError && !incentiveRows.length ? (
          <Text style={styles.empty}>Could not load incentives.</Text>
        ) : !incentiveRows.length ? (
          <Text style={styles.empty}>No programs right now.</Text>
        ) : (
          incentiveRows.map((item) => (
            <EarningsIncentiveRow key={item.id} item={item} currency={currency} />
          ))
        )}
      </View>

      <Pressable onPress={() => router.push(DELIVERY_ROUTES.profile)} style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Payout account</Text>
          <Text style={styles.link}>{bank?.hasAccount ? 'Manage' : 'Add bank'}</Text>
        </View>
        {bankError && !bank ? (
          <Text style={styles.muted}>Could not load bank. Pull to retry.</Text>
        ) : hasPayout ? (
          <>
            <View style={[styles.badge, verified ? styles.badgeOk : styles.badgeWait]}>
              <Text style={[styles.badgeText, verified ? styles.badgeTextOk : styles.badgeTextWait]}>
                {bank?.payoutsEnabled ? 'Instant payouts on' : bank?.hasAccount ? `${bankStatusLabel(bank.verificationStatus)} · verify in Profile` : 'Add bank in Profile'}
              </Text>
            </View>
            {bank?.holderName || payout?.accountHolderName ? (
              <Text style={styles.rowTitle}>{bank?.holderName || payout?.accountHolderName}</Text>
            ) : null}
            <Text style={styles.muted}>A/C {masked}</Text>
            {bank?.ifsc || payout?.ifscCode ? (
              <Text style={styles.muted}>IFSC {bank?.ifsc || payout?.ifscCode}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.muted}>
            No payout account yet. Add IFSC and account number in Profile. Instant payouts need a verified bank.
          </Text>
        )}
      </Pressable>
    </>
  );
}
