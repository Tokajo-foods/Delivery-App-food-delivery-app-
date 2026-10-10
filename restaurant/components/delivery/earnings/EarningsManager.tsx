import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EarningsCodPanel,
  EarningsLedgerPanel,
  EarningsPayoutsPanel,
} from '@/components/delivery/earnings/EarningsRecordsPanel';
import { EarningsWalletPanel } from '@/components/delivery/earnings/EarningsWalletPanel';
import { earningsPageStyles as styles } from '@/components/delivery/earnings/earnings-page-styles';
import { CodRemitSheet } from '@/components/delivery/earnings/CodRemitSheet';
import { InstantPayoutSheet } from '@/components/delivery/earnings/InstantPayoutSheet';
import { PayoutDetailSheet } from '@/components/delivery/earnings/PayoutDetailSheet';
import { DeliveryHeaderActions } from '@/components/delivery/shared/HeaderActions';
import { PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { formatCurrency, lastNDays, selectEarningsPeriod } from '@/lib/delivery-partner/analytics-api';
import {
  usePartnerDailyEarnings,
  usePartnerEarnings,
  usePartnerIncentives,
} from '@/lib/delivery-partner/analytics-hooks';
import type { EarningsPeriodDays, EarningsPeriodKey } from '@/lib/delivery-partner/analytics-types';
import { usePartnerBank } from '@/lib/delivery-partner/bank-hooks';
import { isBankVerified } from '@/lib/delivery-partner/bank-types';
import { formatFinanceError } from '@/lib/delivery-partner/finance-api';
import {
  useCodPending,
  useCodRemittanceHistory,
  useInstantPayoutEligibility,
  usePartnerPayouts,
  usePartnerWallet,
  usePayoutSchedule,
  useWalletTransactions,
} from '@/lib/delivery-partner/finance-hooks';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

const TABS = [
  { key: 'wallet', label: 'Wallet' },
  { key: 'cod', label: 'COD' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'ledger', label: 'Ledger' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const CHART_DAYS: Record<EarningsPeriodKey, EarningsPeriodDays> = {
  today: 7,
  week: 7,
  month: 30,
  lifetime: 90,
};

function when(iso?: string | null) {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  return new Date(ms).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PartnerEarningsManager() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<EarningsPeriodKey>('today');
  const [tab, setTab] = useState<TabKey>('wallet');
  const [txnType, setTxnType] = useState('');
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [showInstant, setShowInstant] = useState(false);
  const [showRemit, setShowRemit] = useState(false);
  const [payoutId, setPayoutId] = useState<string | null>(null);

  const chartDays = CHART_DAYS[period];
  const earnings = usePartnerEarnings();
  const daily = usePartnerDailyEarnings(chartDays);
  const incentivesQuery = usePartnerIncentives();
  const wallet = usePartnerWallet(true);
  const eligibility = useInstantPayoutEligibility(true);
  const schedule = usePayoutSchedule(true);
  const codPending = useCodPending(true);
  const remittances = useCodRemittanceHistory(tab === 'cod');
  const payouts = usePartnerPayouts(tab === 'payouts');
  const ledger = useWalletTransactions(txnType || undefined, tab === 'ledger');
  const bankQuery = usePartnerBank(true);

  const summary = earnings.data;
  const selected = selectEarningsPeriod(summary, period);
  const currency = wallet.data?.currency ?? summary?.currency ?? 'INR';
  const chartPoints = useMemo(
    () => lastNDays(daily.data?.points ?? [], Math.min(chartDays, 14)),
    [daily.data?.points, chartDays]
  );
  const payable = wallet.data?.earningsBalance ?? 0;
  const cashDue = wallet.data?.cashInHand ?? codPending.data?.cashInHand ?? 0;
  const lifetime = wallet.data?.lifetimeEarnings ?? 0;
  const bank = bankQuery.data;
  const payout = summary?.payout;

  const onRefresh = async () => {
    setPullRefreshing(true);
    try {
      await Promise.all([
        earnings.refetch(),
        daily.refetch(),
        incentivesQuery.refetch(),
        bankQuery.refetch(),
        wallet.refetch(),
        eligibility.refetch(),
        schedule.refetch(),
        codPending.refetch(),
        remittances.refetch(),
        payouts.refetch(),
        ledger.refetch(),
      ]);
    } finally {
      setPullRefreshing(false);
    }
  };

  const openInstant = () => {
    if (!eligibility.data?.bankVerified && !isBankVerified(bank)) {
      router.push(DELIVERY_ROUTES.profile);
      return;
    }
    setShowInstant(true);
  };

  const loading = wallet.isLoading && !wallet.data;
  const error =
    wallet.error && !wallet.data
      ? formatFinanceError(wallet.error, 'Could not load wallet.')
      : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.sub}>Payouts and daily totals</Text>
        </View>
        <DeliveryHeaderActions onBrand hideProfile compact />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: PARTNER_BOTTOM_NAV_INSET + 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void onRefresh()}
            tintColor="#EA4B14"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segment}>
          {TABS.map((item) => {
            const on = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={[styles.segmentBtn, on && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#EA4B14" />
            <Text style={styles.muted}>Loading earnings…</Text>
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Could not load earnings</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable onPress={() => void onRefresh()} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : tab === 'wallet' ? (
          <EarningsWalletPanel
            currency={currency}
            payable={payable}
            cashDue={cashDue}
            lifetime={lifetime}
            pendingPayouts={wallet.data?.pendingPayouts ?? 0}
            settled={Math.max(0, lifetime - payable)}
            nextDue={
              schedule.data?.nextPayoutAt || wallet.data?.nextWeeklyPayoutAt
                ? when(schedule.data?.nextPayoutAt ?? wallet.data?.nextWeeklyPayoutAt)
                : 'When the hold window ends'
            }
            period={period}
            onPeriod={setPeriod}
            selected={selected}
            chartPoints={chartPoints}
            hasChart={chartPoints.some((point) => point.earnings > 0 || point.orders > 0)}
            earningsError={earnings.isError && !summary ? formatFinanceError(earnings.error, 'Could not load earnings.') : null}
            onRetryEarnings={() => void earnings.refetch()}
            scheduleError={schedule.isError && !schedule.data ? formatFinanceError(schedule.error, 'Could not load the payout schedule.') : null}
            onRetrySchedule={() => void schedule.refetch()}
            scheduleLine={
              schedule.data
                ? `${schedule.data.weekday ?? 'Tuesday'} · next ${schedule.data.nextPayoutDate ?? (when(schedule.data.nextPayoutAt) || '—')}`
                : null
            }
            feeLine={
              schedule.data
                ? `Instant from ${formatCurrency(schedule.data.instantMin ?? 200, currency)} · fee ${schedule.data.instantFeePercent ?? 2.5}% (min ${formatCurrency(schedule.data.instantFeeMin ?? 5, currency)}) · daily cap ${formatCurrency(schedule.data.instantDailyCap ?? 5000, currency)}`
                : null
            }
            incentiveRows={incentivesQuery.data?.incentives ?? []}
            incentivesError={incentivesQuery.isError}
            bank={bank}
            bankError={bankQuery.isError}
            payout={payout}
            hasPayout={Boolean(bank?.hasAccount || payout?.bankAccountNo || payout?.ifscCode)}
            codBlocked={Boolean(codPending.data?.blocked || wallet.data?.cod?.blocked)}
            codLimit={codPending.data?.limit ?? 0}
            remitDue={Boolean(wallet.data?.cod?.remitDueToday)}
            onWithdraw={openInstant}
            onRemit={() => setShowRemit(true)}
            onHistory={() => setTab('ledger')}
          />
        ) : tab === 'cod' ? (
          <EarningsCodPanel
            currency={currency}
            pending={codPending.data}
            pendingError={codPending.isError && !codPending.data ? formatFinanceError(codPending.error, 'Could not load COD.') : null}
            onRetryPending={() => void codPending.refetch()}
            rows={remittances.data?.pages.flatMap((page) => page.items) ?? []}
            loading={remittances.isLoading && !remittances.data}
            error={remittances.isError ? formatFinanceError(remittances.error, 'Could not load remittances.') : null}
            onRetry={() => void remittances.refetch()}
            hasNext={Boolean(remittances.hasNextPage)}
            loadingMore={remittances.isFetchingNextPage}
            onMore={() => void remittances.fetchNextPage()}
            onRemit={() => setShowRemit(true)}
          />
        ) : tab === 'payouts' ? (
          <EarningsPayoutsPanel
            currency={currency}
            eligible={Boolean(eligibility.data?.eligible)}
            maxAmount={eligibility.data?.maxAmount ?? 0}
            reasons={eligibility.data?.reasons ?? []}
            eligibilityError={eligibility.isError && !eligibility.data ? formatFinanceError(eligibility.error, 'Could not check eligibility.') : null}
            onRetryEligibility={() => void eligibility.refetch()}
            onWithdraw={openInstant}
            rows={payouts.data?.pages.flatMap((page) => page.items) ?? []}
            loading={payouts.isLoading && !payouts.data}
            error={payouts.isError ? formatFinanceError(payouts.error, 'Could not load payouts.') : null}
            onRetry={() => void payouts.refetch()}
            hasNext={Boolean(payouts.hasNextPage)}
            loadingMore={payouts.isFetchingNextPage}
            onMore={() => void payouts.fetchNextPage()}
            onOpen={setPayoutId}
          />
        ) : (
          <EarningsLedgerPanel
            txnType={txnType}
            onType={setTxnType}
            rows={ledger.data?.pages.flatMap((page) => page.items) ?? []}
            loading={ledger.isLoading && !ledger.data}
            error={ledger.isError ? formatFinanceError(ledger.error, 'Could not load the ledger.') : null}
            onRetry={() => void ledger.refetch()}
            hasNext={Boolean(ledger.hasNextPage)}
            loadingMore={ledger.isFetchingNextPage}
            onMore={() => void ledger.fetchNextPage()}
          />
        )}
      </ScrollView>

      <InstantPayoutSheet visible={showInstant} onClose={() => setShowInstant(false)} />
      <CodRemitSheet visible={showRemit} onClose={() => setShowRemit(false)} />
      <PayoutDetailSheet
        visible={Boolean(payoutId)}
        payoutId={payoutId}
        onClose={() => setPayoutId(null)}
      />
    </View>
  );
}
