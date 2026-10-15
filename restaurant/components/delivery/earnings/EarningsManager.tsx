import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CodRemitSheet } from '@/components/delivery/earnings/CodRemitSheet';
import { EarningsCodSummary } from '@/components/delivery/earnings/EarningsCodSummary';
import { EarningsDailyCard } from '@/components/delivery/earnings/EarningsDailyCard';
import { EarningsHeroCard } from '@/components/delivery/earnings/EarningsHeroCard';
import { EarningsPayoutCard } from '@/components/delivery/earnings/EarningsPayoutCard';
import { EarningsCodPanel, EarningsPayoutsPanel } from '@/components/delivery/earnings/EarningsRecordsPanel';
import { earningsPageStyles as styles } from '@/components/delivery/earnings/earnings-page-styles';
import { InstantPayoutSheet } from '@/components/delivery/earnings/InstantPayoutSheet';
import { PassbookPanel } from '@/components/delivery/earnings/PassbookPanel';
import { PayoutDetailSheet } from '@/components/delivery/earnings/PayoutDetailSheet';
import { useEarningsData, type EarningsTab } from '@/components/delivery/earnings/use-earnings-data';
import { DeliveryHeaderActions } from '@/components/delivery/shared/HeaderActions';
import { PARTNER_BOTTOM_NAV_INSET, authTheme } from '@/constants/auth-theme';
import { isBankVerified } from '@/lib/delivery-partner/bank-types';
import { formatFinanceError } from '@/lib/delivery-partner/finance-api';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import { dayLabel, istDayKey } from '@/lib/delivery-partner/passbook';

const TABS: { key: EarningsTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'passbook', label: 'Passbook' },
  { key: 'cash', label: 'COD' },
  { key: 'payouts', label: 'Payouts' },
];

function errorText(query: { isError: boolean; error: unknown; data?: unknown }, fallback: string) {
  return query.isError && !query.data ? formatFinanceError(query.error, fallback) : null;
}

export function PartnerEarningsManager() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<EarningsTab>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showInstant, setShowInstant] = useState(false);
  const [showRemit, setShowRemit] = useState(false);
  const [payoutId, setPayoutId] = useState<string | null>(null);
  const data = useEarningsData(tab);
  const { wallet, earnings, codPending, schedule, bank, passbook } = data;

  const currency = wallet.data?.currency ?? earnings.data?.currency ?? 'INR';
  const cashInHand = codPending.data?.cashInHand ?? wallet.data?.cashInHand ?? 0;
  const nextPayoutIso = schedule.data?.nextPayoutAt ?? wallet.data?.nextWeeklyPayoutAt;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await data.refetchAll();
    } finally {
      setRefreshing(false);
    }
  };

  const openInstant = () => {
    if (!data.eligibility.data?.bankVerified && !isBankVerified(bank.data)) {
      router.push(DELIVERY_ROUTES.profile);
      return;
    }
    setShowInstant(true);
  };

  const walletError = errorText(wallet, 'Could not load your wallet.');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Earnings</Text>
          <Text style={styles.sub}>Trips, cash and payouts in one place</Text>
        </View>
        <DeliveryHeaderActions onBrand hideProfile compact />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: PARTNER_BOTTOM_NAV_INSET + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={authTheme.brand} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.segment}>
          {TABS.map((item) => {
            const on = tab === item.key;
            return (
              <Pressable key={item.key} onPress={() => setTab(item.key)} style={[styles.segmentBtn, on && styles.segmentOn]}>
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {wallet.isLoading && !wallet.data ? (
          <View style={styles.center}>
            <ActivityIndicator color={authTheme.brand} />
            <Text style={styles.muted}>Loading earnings…</Text>
          </View>
        ) : walletError ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Could not load earnings</Text>
            <Text style={styles.muted}>{walletError}</Text>
            <Pressable onPress={() => void onRefresh()} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : tab === 'overview' ? (
          <>
            <EarningsHeroCard
              currency={currency}
              lifetime={wallet.data?.lifetimeEarnings ?? earnings.data?.lifetime.totalEarnings ?? 0}
              lifetimeTrips={earnings.data?.lifetime.totalDeliveries ?? 0}
              summary={earnings.data}
              payable={wallet.data?.earningsBalance ?? 0}
              onWithdraw={openInstant}
            />
            <EarningsCodSummary
              currency={currency}
              pending={codPending.data}
              cashInHand={cashInHand}
              error={errorText(codPending, 'Could not load COD.')}
              onRetry={() => void codPending.refetch()}
              onDeposit={() => setShowRemit(true)}
              onHistory={() => setTab('cash')}
            />
            <EarningsDailyCard
              currency={currency}
              range={data.dailyRange}
              onRange={data.setDailyRange}
              points={data.daily.data?.points ?? []}
              loading={data.daily.isLoading && !data.daily.data}
              error={errorText(data.daily, 'Could not load daily earnings.')}
              onRetry={() => void data.daily.refetch()}
            />
            <EarningsPayoutCard
              currency={currency}
              bank={bank.data}
              bankError={bank.isError}
              nextPayout={nextPayoutIso ? dayLabel(istDayKey(nextPayoutIso)) : null}
              scheduleNote={schedule.data?.cycle ? `${schedule.data.cycle} payout` : null}
              incentives={data.incentives.data?.incentives ?? []}
            />
          </>
        ) : tab === 'passbook' ? (
          <PassbookPanel
            currency={currency}
            filter={data.passbookFilter}
            onFilter={data.setPassbookFilter}
            range={data.passbookRange}
            onRange={data.setPassbookRange}
            rows={passbook.data?.pages.flatMap((page) => page.items) ?? []}
            total={passbook.data?.pages[0]?.total ?? 0}
            loading={passbook.isLoading && !passbook.data}
            error={passbook.isError ? formatFinanceError(passbook.error, 'Could not load the passbook.') : null}
            onRetry={() => void passbook.refetch()}
            hasNext={Boolean(passbook.hasNextPage)}
            loadingMore={passbook.isFetchingNextPage}
            onMore={() => void passbook.fetchNextPage()}
          />
        ) : tab === 'cash' ? (
          <EarningsCodPanel
            currency={currency}
            pending={codPending.data}
            pendingError={errorText(codPending, 'Could not load COD.')}
            onRetryPending={() => void codPending.refetch()}
            rows={data.remittances.data?.pages.flatMap((page) => page.items) ?? []}
            loading={data.remittances.isLoading && !data.remittances.data}
            error={data.remittances.isError ? formatFinanceError(data.remittances.error, 'Could not load deposits.') : null}
            onRetry={() => void data.remittances.refetch()}
            hasNext={Boolean(data.remittances.hasNextPage)}
            loadingMore={data.remittances.isFetchingNextPage}
            onMore={() => void data.remittances.fetchNextPage()}
            onRemit={() => setShowRemit(true)}
          />
        ) : (
          <EarningsPayoutsPanel
            currency={currency}
            eligible={Boolean(data.eligibility.data?.eligible)}
            maxAmount={data.eligibility.data?.maxAmount ?? 0}
            reasons={data.eligibility.data?.reasons ?? []}
            eligibilityError={errorText(data.eligibility, 'Could not check eligibility.')}
            onRetryEligibility={() => void data.eligibility.refetch()}
            onWithdraw={openInstant}
            rows={data.payouts.data?.pages.flatMap((page) => page.items) ?? []}
            loading={data.payouts.isLoading && !data.payouts.data}
            error={data.payouts.isError ? formatFinanceError(data.payouts.error, 'Could not load payouts.') : null}
            onRetry={() => void data.payouts.refetch()}
            hasNext={Boolean(data.payouts.hasNextPage)}
            loadingMore={data.payouts.isFetchingNextPage}
            onMore={() => void data.payouts.fetchNextPage()}
            onOpen={setPayoutId}
          />
        )}
      </ScrollView>

      <InstantPayoutSheet visible={showInstant} onClose={() => setShowInstant(false)} />
      <CodRemitSheet visible={showRemit} onClose={() => setShowRemit(false)} />
      <PayoutDetailSheet visible={Boolean(payoutId)} payoutId={payoutId} onClose={() => setPayoutId(null)} />
    </View>
  );
}
