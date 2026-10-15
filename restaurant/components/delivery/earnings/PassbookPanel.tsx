import { Fragment, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { PassbookRow } from '@/components/delivery/earnings/PassbookRow';
import { passbookStyles as styles } from '@/components/delivery/earnings/passbook-styles';
import { authTheme } from '@/constants/auth-theme';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { WalletTransaction } from '@/lib/delivery-partner/finance-types';
import { groupPassbook } from '@/lib/delivery-partner/passbook';

export const PASSBOOK_FILTERS = [
  { key: '', label: 'All' },
  { key: 'delivery_credit', label: 'Trips' },
  { key: 'cod_collect', label: 'Cash collected' },
  { key: 'cod_remit', label: 'Deposits' },
  { key: 'payout_debit', label: 'Payouts' },
  { key: 'incentive_credit', label: 'Bonus' },
] as const;

export const PASSBOOK_RANGES = [7, 30, 90] as const;
export type PassbookRange = (typeof PASSBOOK_RANGES)[number];

type Props = {
  currency: string;
  filter: string;
  onFilter: (key: string) => void;
  range: PassbookRange;
  onRange: (range: PassbookRange) => void;
  rows: WalletTransaction[];
  total: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  hasNext: boolean;
  loadingMore: boolean;
  onMore: () => void;
};

export function PassbookPanel({
  currency,
  filter,
  onFilter,
  range,
  onRange,
  rows,
  total,
  loading,
  error,
  onRetry,
  hasNext,
  loadingMore,
  onMore,
}: Props) {
  const days = useMemo(() => groupPassbook(rows), [rows]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View>
          <Text style={styles.title}>Passbook</Text>
          <Text style={styles.sub}>
            Last {range} days{total ? ` · ${total} entries` : ''}
          </Text>
        </View>
        <View style={styles.segment}>
          {PASSBOOK_RANGES.map((value) => {
            const on = range === value;
            return (
              <Pressable
                key={value}
                onPress={() => onRange(value)}
                style={[styles.segmentBtn, on && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{value}D</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.chips}>
        {PASSBOOK_FILTERS.map((item) => {
          const on = filter === item.key;
          return (
            <Pressable
              key={item.key || 'all'}
              onPress={() => onFilter(item.key)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={authTheme.brand} />
        </View>
      ) : error ? (
        <Pressable onPress={onRetry} style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.moreText}>Retry</Text>
        </Pressable>
      ) : !days.length ? (
        <View style={styles.center}>
          <Text style={styles.empty}>No entries in the last {range} days.</Text>
        </View>
      ) : (
        days.map((day) => (
          <Fragment key={day.key}>
            <View style={styles.dayHead}>
              <Text style={styles.dayLabel}>{day.label.toUpperCase()}</Text>
              <Text style={styles.daySummary}>
                {[
                  day.earned > 0 ? `+${formatCurrency(day.earned, currency)} earned` : null,
                  day.cashIn > 0 ? `${formatCurrency(day.cashIn, currency)} cash` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            {day.rows.map((row, index) => (
              <PassbookRow key={row.id} row={row} first={index === 0} />
            ))}
          </Fragment>
        ))
      )}

      {hasNext && !loading && !error ? (
        <Pressable onPress={onMore} style={styles.more} disabled={loadingMore}>
          <Text style={styles.moreText}>{loadingMore ? 'Loading…' : 'Load older entries'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
