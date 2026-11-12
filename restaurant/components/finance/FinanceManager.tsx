import {
  Banknote,
  ChevronRight,
  Percent,
  Receipt,
  Wallet,
  X,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { SettlementSummaryStrip } from '@/components/finance/SettlementSummaryStrip';
import { WalletPassbook } from '@/components/finance/WalletPassbook';
import { WalletWithdrawals } from '@/components/finance/WalletWithdrawals';
import { WithdrawEarningsSheet } from '@/components/finance/WithdrawEarningsSheet';
import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import {
  useRestaurantCommission,
  useRestaurantInvoices,
  useRestaurantPayouts,
  useRestaurantSettlement,
  useRestaurantSettlements,
  useRestaurantWallet,
  useRestaurantWalletTransactions,
} from '@/lib/restaurant/finance-hooks';
import type {
  RestaurantInvoice,
  RestaurantSettlement,
} from '@/lib/restaurant/finance-types';

type TabKey = 'wallet' | 'payouts' | 'invoices' | 'fees';

const TABS: { key: TabKey; label: string; Icon: typeof Wallet }[] = [
  { key: 'wallet', label: 'Wallet', Icon: Wallet },
  { key: 'payouts', label: 'Payouts', Icon: Banknote },
  { key: 'invoices', label: 'Invoices', Icon: Receipt },
  { key: 'fees', label: 'Fees', Icon: Percent },
];

const STATUS_TONE: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: '#ECFDF3', fg: '#067647', label: 'Paid' },
  issued: { bg: '#EFF8FF', fg: '#175CD3', label: 'Issued' },
  pending: { bg: '#FFFAEB', fg: '#B54708', label: 'Upcoming' },
  processing: { bg: '#EFF8FF', fg: '#175CD3', label: 'Processing' },
  failed: { bg: '#FEF3F2', fg: '#B42318', label: 'Failed' },
  on_hold: { bg: '#F8FAFC', fg: '#475569', label: 'On hold' },
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function statusTone(status: string) {
  return (
    STATUS_TONE[status] ?? {
      bg: '#F1F5F9',
      fg: '#475569',
      label: status.replace(/_/g, ' '),
    }
  );
}

function StatusChip({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: tone.fg }]} />
      <Text style={[styles.chipText, { color: tone.fg }]}>{tone.label}</Text>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

function MetricStrip({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <View style={styles.metrics}>
      <Text style={styles.metricsKicker}>Summary</Text>
      <View style={styles.metricsRow}>
        {items.map((item, index) => (
          <View
            key={item.label}
            style={[styles.metric, index > 0 && styles.metricDivider]}
          >
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
              {item.value}
            </Text>
            <Text style={styles.metricLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.muted}>{body}</Text>
    </View>
  );
}

function SettlementCard({
  settlement,
  onPress,
}: {
  settlement: RestaurantSettlement;
  onPress: () => void;
}) {
  const period =
    settlement.periodStart && settlement.periodEnd
      ? `${formatDate(settlement.periodStart)} – ${formatDate(settlement.periodEnd)}`
      : 'Settlement cycle';
  const tone = statusTone(settlement.status);
  return (
    <Pressable onPress={onPress} style={styles.docCard}>
      <View style={[styles.docRail, { backgroundColor: tone.fg }]} />
      <View style={styles.docBody}>
        <View style={styles.docTop}>
          <View style={styles.docCopy}>
            <Text style={styles.kicker}>Settlement</Text>
            <Text style={styles.docId} numberOfLines={1}>
              {settlement.settlementNumber}
            </Text>
            <Text style={styles.meta}>
              {period} · {settlement.totalOrders} order
              {settlement.totalOrders === 1 ? '' : 's'}
            </Text>
          </View>
          <StatusChip status={settlement.status} />
        </View>
        <View style={styles.docFoot}>
          <View>
            <Text style={styles.footLabel}>Payable</Text>
            <Text style={styles.amount}>{formatCurrency(settlement.finalPayable)}</Text>
          </View>
          <View style={styles.openRow}>
            <Text style={styles.openText}>Statement</Text>
            <ChevronRight color={authTheme.textMuted} size={16} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function InvoiceCard({
  invoice,
  onPress,
}: {
  invoice: RestaurantInvoice;
  onPress: () => void;
}) {
  const tone = statusTone(invoice.status);
  return (
    <Pressable onPress={onPress} style={styles.docCard}>
      <View style={[styles.docRail, { backgroundColor: tone.fg }]} />
      <View style={styles.docBody}>
        <View style={styles.docTop}>
          <View style={styles.docCopy}>
            <Text style={styles.kicker}>
              {invoice.invoiceType?.replace(/_/g, ' ') || 'GST invoice'}
            </Text>
            <Text style={styles.docId} numberOfLines={1}>
              {invoice.invoiceId}
            </Text>
            <Text style={styles.meta}>
              {invoice.period || 'Billing period'} · Issued {formatDate(invoice.issuedAt)}
            </Text>
          </View>
          <StatusChip status={invoice.status} />
        </View>
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Gross</Text>
              <Text style={styles.gridValue}>{formatCurrency(invoice.grossAmount)}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Commission</Text>
              <Text style={styles.gridValue}>{formatCurrency(invoice.commissionAmount)}</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>GST</Text>
              <Text style={styles.gridValue}>{formatCurrency(invoice.gstOnCommission)}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>TDS</Text>
              <Text style={styles.gridValue}>{formatCurrency(invoice.tdsAmount)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.docFoot}>
          <View>
            <Text style={styles.footLabel}>Net payout</Text>
            <Text style={styles.amount}>{formatCurrency(invoice.netAmount)}</Text>
          </View>
          <View style={styles.openRow}>
            <Text style={styles.openText}>Details</Text>
            <ChevronRight color={authTheme.textMuted} size={16} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function FinanceManager() {
  const [tab, setTab] = useState<TabKey>('wallet');
  const [page, setPage] = useState(1);
  const [ledgerFilter, setLedgerFilter] = useState<
    'all' | 'order_credit' | 'payout_debit' | 'adjustment'
  >('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<RestaurantInvoice | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const wallet = useRestaurantWallet();
  const walletTxns = useRestaurantWalletTransactions(
    tab === 'wallet' ? page : 1,
    ledgerFilter
  );
  const withdrawals = useRestaurantPayouts(1);
  const payouts = useRestaurantSettlements(tab === 'payouts' ? page : 1);
  const invoices = useRestaurantInvoices(tab === 'invoices' ? page : 1);
  const commission = useRestaurantCommission();
  const detail = useRestaurantSettlement(selectedId);

  const listQuery =
    tab === 'wallet'
      ? walletTxns
      : tab === 'invoices'
        ? invoices
        : tab === 'fees'
          ? commission
          : payouts;
  const restaurantName =
    wallet.restaurantName
    || payouts.restaurantName
    || invoices.restaurantName
    || commission.restaurantName;
  const loading =
    (tab === 'wallet'
      ? wallet.isLoading && !wallet.data
      : listQuery.isLoading && !listQuery.data);
  const refreshing =
    tab === 'wallet'
      ? wallet.isRefetching || walletTxns.isRefetching || withdrawals.isRefetching
      : listQuery.isRefetching;
  const hasNext =
    tab === 'fees' ? false : (listQuery.data as { hasNext?: boolean } | undefined)?.hasNext ?? false;
  const payoutList = payouts.data?.items ?? [];
  const settlementList = payoutList;
  const invoiceList = invoices.data?.items ?? [];
  const txnList = walletTxns.data?.items ?? [];
  const settlementPayable = settlementList.reduce((sum, row) => sum + row.finalPayable, 0);
  const settlementPaid = settlementList.filter((row) => row.status === 'paid').length;
  const invoiceNet = invoiceList.reduce((sum, row) => sum + row.netAmount, 0);
  const invoiceGst = invoiceList.reduce((sum, row) => sum + row.gstOnCommission, 0);

  const switchTab = (next: TabKey) => {
    setTab(next);
    setPage(1);
  };

  const selectedSummary = settlementList.find((row) => row.id === selectedId);
  const settlement: RestaurantSettlement | undefined = detail.data ?? selectedSummary;

  const onRefresh = () => {
    if (tab === 'wallet') {
      void wallet.refetch();
      void walletTxns.refetch();
      void withdrawals.refetch();
      return;
    }
    void listQuery.refetch();
  };

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader
        title="Payouts & invoices"
        subtitle={restaurantName || 'Settlements, GST invoices, and fees'}
        showBack
        hideProfile
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: PARTNER_BOTTOM_NAV_INSET },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabGroup}>
          {TABS.map((item) => {
            const on = item.key === tab;
            const Icon = item.Icon;
            return (
              <Pressable
                key={item.key}
                onPress={() => switchTab(item.key)}
                style={[styles.tab, on && styles.tabActive]}
              >
                <Icon color={on ? authTheme.brand : authTheme.textMuted} size={15} strokeWidth={2.2} />
                <Text
                  style={[styles.tabText, on && styles.tabTextActive]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={authTheme.brand} size="large" />
          </View>
        ) : null}

        {!loading && listQuery.isError && tab !== 'wallet' ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Couldn’t load {tab}</Text>
            <Text style={styles.muted}>
              {listQuery.error instanceof Error
                ? listQuery.error.message
                : 'Please try again'}
            </Text>
            <Pressable style={styles.retry} onPress={() => void listQuery.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && tab === 'wallet' ? (
          <View style={styles.list}>
            <SettlementSummaryStrip
              wallet={wallet.data}
              withdrawDisabled={
                (wallet.data?.available ?? wallet.data?.balance ?? 0) < 1
              }
              onRequestWithdraw={() => setWithdrawOpen(true)}
            />
            <WalletWithdrawals items={withdrawals.data?.items ?? []} />
            <WalletPassbook
              restaurantId={wallet.restaurantId}
              wallet={wallet.data}
              txns={txnList}
              filter={ledgerFilter}
              onFilterChange={(next) => {
                setLedgerFilter(next);
                setPage(1);
              }}
              walletError={
                wallet.error instanceof Error ? wallet.error : null
              }
              txnsError={
                walletTxns.error instanceof Error ? walletTxns.error : null
              }
              onRetry={onRefresh}
            />
          </View>
        ) : null}

        {!loading && !listQuery.isError && tab === 'payouts' ? (
          settlementList.length ? (
            <View style={styles.list}>
              <MetricStrip
                items={[
                  { label: 'Payable', value: formatCurrency(settlementPayable) },
                  { label: 'Cycles', value: String(settlementList.length) },
                  { label: 'Paid', value: String(settlementPaid) },
                ]}
              />
              <Text style={styles.sectionHint}>
                Closed settlement cycles. Instant withdrawals stay on Wallet.
              </Text>
              {settlementList.map((row) => (
                <SettlementCard
                  key={row.id}
                  settlement={row}
                  onPress={() => setSelectedId(row.id)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Banknote color={authTheme.brand} size={22} />}
              title="No payouts yet"
              body="Settlement cycles appear here after a period closes. Instant withdrawals stay on Wallet."
            />
          )
        ) : null}

        {!loading && !listQuery.isError && tab === 'invoices' ? (
          invoiceList.length ? (
            <View style={styles.list}>
              <MetricStrip
                items={[
                  { label: 'Net payout', value: formatCurrency(invoiceNet) },
                  { label: 'GST', value: formatCurrency(invoiceGst) },
                  { label: 'Invoices', value: String(invoiceList.length) },
                ]}
              />
              <Text style={styles.sectionHint}>
                GST invoices for each settlement cycle.
              </Text>
              {invoiceList.map((row) => (
                <InvoiceCard
                  key={`${row.invoiceId}-${row.payoutId}`}
                  invoice={row}
                  onPress={() => setSelectedInvoice(row)}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={<Receipt color={authTheme.brand} size={22} />}
              title="No invoices yet"
              body="A GST invoice is created with each settlement cycle."
            />
          )
        ) : null}

        {!loading && !listQuery.isError && tab === 'fees' && commission.data ? (
          <View style={styles.plainCard}>
            <Text style={styles.kicker}>Platform fee</Text>
            <Text style={styles.docId}>{commission.data.commissionPercent}%</Text>
            <Text style={styles.meta}>
              {commission.data.source === 'restaurant_override'
                ? 'Custom outlet rate'
                : 'Platform default'}
              {commission.data.effectiveFrom
                ? ` · from ${formatDate(commission.data.effectiveFrom)}`
                : ''}
            </Text>
            <View style={styles.docFoot}>
              <View>
                <Text style={styles.footLabel}>TDS</Text>
                <Text style={styles.amount}>{commission.data.tdsPercent}%</Text>
              </View>
            </View>
            <View style={styles.breakdown}>
              {commission.data.feeSchedule.map((row) => (
                <View key={row.id || row.label} style={styles.feeRow}>
                  <Line
                    label={row.label}
                    value={
                      row.type === 'flat'
                        ? formatCurrency(row.value)
                        : `${row.value}%`
                    }
                  />
                  {row.description ? (
                    <Text style={styles.feeHint}>{row.description}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {!loading && !listQuery.isError && (page > 1 || hasNext) && tab !== 'fees' ? (
          <View style={styles.pager}>
            <Pressable
              disabled={page <= 1 || listQuery.isFetching}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              style={[styles.pageBtn, page <= 1 && styles.disabled]}
            >
              <Text style={styles.pageBtnText}>Previous</Text>
            </Pressable>
            <Text style={styles.pageLabel}>Page {page}</Text>
            <Pressable
              disabled={!hasNext || listQuery.isFetching}
              onPress={() => setPage((p) => p + 1)}
              style={[styles.pageBtn, !hasNext && styles.disabled]}
            >
              <Text style={styles.pageBtnText}>Next</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(selectedId)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.grabber} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settlement statement</Text>
              <Pressable onPress={() => setSelectedId(null)} hitSlop={8} style={styles.closeBtn}>
                <X color={authTheme.text} size={18} />
              </Pressable>
            </View>
            {detail.isLoading && !settlement ? (
              <ActivityIndicator color={authTheme.brand} />
            ) : detail.isError && !settlement ? (
              <Text style={styles.muted}>
                {detail.error instanceof Error
                  ? detail.error.message
                  : 'Could not load this settlement.'}
              </Text>
            ) : settlement ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
                <View style={styles.modalHero}>
                  <View style={styles.docCopy}>
                    <Text style={styles.kicker}>Payable</Text>
                    <Text style={styles.sheetAmount}>{formatCurrency(settlement.finalPayable)}</Text>
                    <Text style={styles.meta}>{settlement.settlementNumber}</Text>
                  </View>
                  <StatusChip status={settlement.status} />
                </View>
                <View style={styles.breakdown}>
                  <Line
                    label="Period"
                    value={
                      settlement.periodStart && settlement.periodEnd
                        ? `${formatDate(settlement.periodStart)} – ${formatDate(settlement.periodEnd)}`
                        : '—'
                    }
                  />
                  <Line label="Gross sales" value={formatCurrency(settlement.grossSales)} />
                  <Line
                    label="Commission"
                    value={formatCurrency(settlement.commissionAmount)}
                  />
                  <Line label="Refund impact" value={formatCurrency(settlement.refundImpact)} />
                  <Line label="Orders" value={String(settlement.totalOrders)} />
                  {settlement.payoutStatus ? (
                    <Line label="Payout status" value={settlement.payoutStatus.replace(/_/g, ' ')} />
                  ) : null}
                  {settlement.payoutReference ? (
                    <Line label="Reference" value={settlement.payoutReference} />
                  ) : null}
                  <Line label="Paid on" value={formatDate(settlement.paidAt)} />
                </View>
                {settlement.orders?.length ? (
                  <View style={styles.orderBlock}>
                    <Text style={styles.kicker}>Included orders</Text>
                    {settlement.orders.slice(0, 8).map((order) => (
                      <Line
                        key={order.orderId}
                        label={order.orderNumber ?? order.orderId.slice(-6)}
                        value={formatCurrency(order.restaurantNetAmount)}
                      />
                    ))}
                  </View>
                ) : null}
                {settlement.failureReason ? (
                  <Text style={styles.fail}>{settlement.failureReason}</Text>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(selectedInvoice)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedInvoice(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.grabber} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice</Text>
              <Pressable onPress={() => setSelectedInvoice(null)} hitSlop={8} style={styles.closeBtn}>
                <X color={authTheme.text} size={18} />
              </Pressable>
            </View>
            {selectedInvoice ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
                <View style={styles.modalHero}>
                  <View style={styles.docCopy}>
                    <Text style={styles.kicker}>Net payout</Text>
                    <Text style={styles.sheetAmount}>{formatCurrency(selectedInvoice.netAmount)}</Text>
                    <Text style={styles.meta}>{selectedInvoice.invoiceId}</Text>
                  </View>
                  <StatusChip status={selectedInvoice.status} />
                </View>
                <View style={styles.breakdown}>
                  <Line label="Type" value={selectedInvoice.invoiceType?.replace(/_/g, ' ') || 'GST invoice'} />
                  <Line label="Period" value={selectedInvoice.period || '—'} />
                  <Line label="Issued" value={formatDate(selectedInvoice.issuedAt)} />
                  <Line label="Paid on" value={formatDate(selectedInvoice.paidAt)} />
                  <Line label="Gross" value={formatCurrency(selectedInvoice.grossAmount)} />
                  <Line label="Commission" value={formatCurrency(selectedInvoice.commissionAmount)} />
                  <Line label="GST on commission" value={formatCurrency(selectedInvoice.gstOnCommission)} />
                  <Line label="TDS" value={formatCurrency(selectedInvoice.tdsAmount)} />
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
      <WithdrawEarningsSheet
        visible={withdrawOpen}
        available={wallet.data?.available ?? wallet.data?.balance ?? 0}
        onClose={() => setWithdrawOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6F7' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14, paddingTop: 14 },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFF4EE',
  },
  tabText: {
    color: authTheme.textMuted,
    fontSize: 11,
    fontFamily: fonts.semiBold,
  },
  tabTextActive: { color: authTheme.brand },
  list: { gap: 10 },
  sectionHint: {
    color: authTheme.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.medium,
    marginTop: -2,
  },
  metrics: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    shadowColor: '#1F1300',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  metricsKicker: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
  },
  metric: { flex: 1, alignItems: 'center', paddingHorizontal: 6, gap: 3 },
  metricDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#E2E8F0',
  },
  metricValue: {
    color: authTheme.text,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  metricLabel: {
    color: authTheme.textMuted,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  docCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    overflow: 'hidden',
  },
  docRail: { width: 4 },
  docBody: { flex: 1, padding: 14, gap: 12 },
  docTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  docCopy: { flex: 1, gap: 2 },
  kicker: {
    color: authTheme.textMuted,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontFamily: fonts.semiBold,
  },
  docId: { color: authTheme.text, fontSize: 16, fontFamily: fonts.bold },
  meta: { color: authTheme.textMuted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 17 },
  docFoot: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8ECF1',
    paddingTop: 12,
  },
  footLabel: { color: authTheme.textMuted, fontSize: 11, fontFamily: fonts.medium },
  amount: { color: authTheme.text, fontSize: 20, fontFamily: fonts.extraBold, marginTop: 2 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 },
  openText: { color: authTheme.textMuted, fontSize: 12, fontFamily: fonts.semiBold },
  grid: { gap: 8 },
  gridRow: { flexDirection: 'row', gap: 8 },
  gridCell: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  gridLabel: { color: authTheme.textMuted, fontSize: 11, fontFamily: fonts.medium },
  gridValue: { color: authTheme.text, fontSize: 13, fontFamily: fonts.semiBold },
  plainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
    gap: 6,
  },
  feeRow: { gap: 2 },
  feeHint: { color: authTheme.textMuted, fontSize: 12, fontFamily: fonts.medium },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontFamily: fonts.bold, textTransform: 'capitalize' },
  breakdown: { gap: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lineLabel: { flex: 1, color: authTheme.textMuted, fontSize: 13, fontFamily: fonts.medium },
  lineValue: { color: authTheme.text, fontSize: 13, fontFamily: fonts.semiBold, textAlign: 'right' },
  center: { paddingVertical: 48, alignItems: 'center' },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: authTheme.text, fontSize: 16, fontFamily: fonts.bold },
  muted: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
  retry: {
    alignSelf: 'center',
    backgroundColor: authTheme.brand,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryText: { color: '#FFFFFF', fontSize: 14, fontFamily: fonts.bold },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 6,
  },
  pageBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pageBtnText: { color: authTheme.text, fontFamily: fonts.semiBold, fontSize: 13 },
  pageLabel: { color: authTheme.textMuted, fontFamily: fonts.semiBold, fontSize: 12 },
  disabled: { opacity: 0.4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
    maxHeight: '88%',
    gap: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: authTheme.text, fontSize: 17, fontFamily: fonts.bold },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: { gap: 16, paddingBottom: 8 },
  modalHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  sheetAmount: {
    color: authTheme.text,
    fontSize: 28,
    fontFamily: fonts.extraBold,
    marginTop: 2,
  },
  orderBlock: { gap: 10 },
  fail: { color: authTheme.error, fontSize: 13, fontFamily: fonts.medium },
});
