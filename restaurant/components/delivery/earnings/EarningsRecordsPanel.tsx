import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { earningsPageStyles as styles } from '@/components/delivery/earnings/earnings-page-styles';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { CodPending, CodRemittance, PartnerPayout, WalletTransaction } from '@/lib/delivery-partner/finance-types';
import { eligibilityReasonCopy, payoutStatusLabel, walletTxnLabel } from '@/lib/delivery-partner/finance-types';

const TXN_TYPES = [
  { key: '', label: 'All' },
  { key: 'delivery_credit', label: 'Trips' },
  { key: 'payout_debit', label: 'Payouts' },
  { key: 'cod_collect', label: 'COD in' },
  { key: 'cod_remit', label: 'Remits' },
  { key: 'incentive_credit', label: 'Bonus' },
];

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

export function EarningsCodPanel({
  currency,
  pending,
  pendingError,
  onRetryPending,
  rows,
  loading,
  error,
  onRetry,
  hasNext,
  loadingMore,
  onMore,
  onRemit,
}: {
  currency: string;
  pending?: CodPending;
  pendingError: string | null;
  onRetryPending: () => void;
  rows: CodRemittance[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasNext: boolean;
  loadingMore: boolean;
  onMore: () => void;
  onRemit: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>Cash due</Text>
        <Pressable onPress={onRemit}>
          <Text style={styles.link}>Remit</Text>
        </Pressable>
      </View>
      {pendingError ? (
        <Pressable onPress={onRetryPending}>
          <Text style={styles.muted}>{pendingError}</Text>
        </Pressable>
      ) : (
        <>
          <Text style={styles.heroAmount}>
            {formatCurrency(pending?.cashInHand ?? 0, currency)}
          </Text>
          <Text style={styles.muted}>
            Limit {formatCurrency(pending?.limit ?? 0, currency)} · remaining{' '}
            {formatCurrency(pending?.remainingCapacity ?? 0, currency)}
          </Text>
          <Text style={styles.muted}>
            Today {formatCurrency(pending?.todayCollected ?? 0, currency)} ·{' '}
            {pending?.todayCount ?? 0} trips · remitted{' '}
            {formatCurrency(pending?.remittedLifetime ?? 0, currency)}
          </Text>
          {pending?.blocked ? (
            <Text style={[styles.muted, styles.negative]}>
              New COD orders stay blocked until you remit.
            </Text>
          ) : null}
        </>
      )}
      <Text style={styles.cardTitle}>Remittance history</Text>
      {loading ? <ActivityIndicator color="#EA4B14" /> : null}
      {error ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.muted}>{error}</Text>
        </Pressable>
      ) : !rows.length && !loading ? (
        <Text style={styles.empty}>No remittances yet.</Text>
      ) : (
        rows.map((row) => (
          <View key={row.remittanceId} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle}>
                {row.method.replace(/_/g, ' ')} · {row.status}
              </Text>
              <Text style={styles.rowValue}>{formatCurrency(row.amount, currency)}</Text>
            </View>
            <Text style={styles.rowMeta}>
              {[row.reference, when(row.remittedAt)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ))
      )}
      {hasNext ? (
        <Pressable onPress={onMore} style={styles.retry} disabled={loadingMore}>
          <Text style={styles.retryText}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EarningsPayoutsPanel({
  currency,
  eligible,
  maxAmount,
  reasons,
  eligibilityError,
  onRetryEligibility,
  onWithdraw,
  rows,
  loading,
  error,
  onRetry,
  hasNext,
  loadingMore,
  onMore,
  onOpen,
}: {
  currency: string;
  eligible: boolean;
  maxAmount: number;
  reasons: string[];
  eligibilityError: string | null;
  onRetryEligibility: () => void;
  onWithdraw: () => void;
  rows: PartnerPayout[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasNext: boolean;
  loadingMore: boolean;
  onMore: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Instant payout</Text>
          <Pressable onPress={onWithdraw}>
            <Text style={styles.link}>Withdraw</Text>
          </Pressable>
        </View>
        {eligibilityError ? (
          <Pressable onPress={onRetryEligibility}>
            <Text style={styles.muted}>{eligibilityError}</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.muted}>
              {eligible
                ? `Ready · up to ${formatCurrency(maxAmount, currency)}`
                : 'Not eligible for an instant payout yet.'}
            </Text>
            {reasons.map((code) => (
              <Text key={code} style={[styles.muted, styles.negative]}>
                {eligibilityReasonCopy(code)}
              </Text>
            ))}
          </>
        )}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Settlements</Text>
        {loading ? <ActivityIndicator color="#EA4B14" /> : null}
        {error ? (
          <Pressable onPress={onRetry}>
            <Text style={styles.muted}>{error}</Text>
          </Pressable>
        ) : !rows.length && !loading ? (
          <Text style={styles.empty}>No payouts yet.</Text>
        ) : (
          rows.map((row) => {
            const paid = row.status.toLowerCase() === 'paid' && Boolean(row.paidAt);
            return (
              <Pressable key={row.payoutId} onPress={() => onOpen(row.payoutId)} style={styles.row}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowTitle}>
                    {row.kind === 'instant' ? 'Instant' : 'Weekly'} ·{' '}
                    {paid ? 'Paid' : payoutStatusLabel(row.status)}
                  </Text>
                  <Text style={styles.rowValue}>{formatCurrency(row.netAmount, currency)}</Text>
                </View>
                <Text style={styles.rowMeta}>
                  {[row.bankAccountMasked, when(row.requestedAt)].filter(Boolean).join(' · ')}
                </Text>
              </Pressable>
            );
          })
        )}
        {hasNext ? (
          <Pressable onPress={onMore} style={styles.retry} disabled={loadingMore}>
            <Text style={styles.retryText}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

export function EarningsLedgerPanel({
  txnType,
  onType,
  rows,
  loading,
  error,
  onRetry,
  hasNext,
  loadingMore,
  onMore,
}: {
  txnType: string;
  onType: (key: string) => void;
  rows: WalletTransaction[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasNext: boolean;
  loadingMore: boolean;
  onMore: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Ledger</Text>
      <View style={styles.chips}>
        {TXN_TYPES.map((item) => {
          const on = txnType === item.key;
          return (
            <Pressable
              key={item.key || 'all'}
              onPress={() => onType(item.key)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {loading ? <ActivityIndicator color="#EA4B14" /> : null}
      {error ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.muted}>{error}</Text>
        </Pressable>
      ) : !rows.length && !loading ? (
        <Text style={styles.empty}>No ledger rows.</Text>
      ) : (
        rows.map((row) => {
          const debit = (row.direction ?? '').toLowerCase() === 'debit';
          return (
            <View key={row.id} style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle}>{walletTxnLabel(row.type)}</Text>
                <Text style={[styles.rowValue, debit && styles.negative]}>
                  {debit ? '−' : '+'}
                  {formatCurrency(row.netAmount ?? row.amount, row.currency)}
                </Text>
              </View>
              <Text style={styles.rowMeta}>
                {[row.note, row.status, when(row.createdAt)].filter(Boolean).join(' · ')}
              </Text>
            </View>
          );
        })
      )}
      {hasNext ? (
        <Pressable onPress={onMore} style={styles.retry} disabled={loadingMore}>
          <Text style={styles.retryText}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
