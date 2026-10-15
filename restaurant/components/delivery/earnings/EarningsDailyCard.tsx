import { CalendarDays } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { overviewStyles as styles } from '@/components/delivery/earnings/earnings-overview-styles';
import { authTheme } from '@/constants/auth-theme';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import type { PartnerDailyEarning } from '@/lib/delivery-partner/analytics-types';
import { dayLabel, fillDays, shortDayLabel } from '@/lib/delivery-partner/passbook';

export type DailyRange = 7 | 30;

type Props = {
  currency: string;
  range: DailyRange;
  onRange: (range: DailyRange) => void;
  points: PartnerDailyEarning[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

const LIST_PREVIEW = 7;

export function EarningsDailyCard({ currency, range, onRange, points, loading, error, onRetry }: Props) {
  const days = useMemo(() => fillDays(points, range), [points, range]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const max = Math.max(1, ...days.map((d) => d.earnings));
  const selected = days.find((d) => d.date === selectedKey) ?? days[days.length - 1];
  const totals = days.reduce(
    (acc, d) => ({
      earned: acc.earned + d.earnings,
      trips: acc.trips + d.orders,
      cod: acc.cod + (d.codCollected ?? 0),
    }),
    { earned: 0, trips: 0, cod: 0 }
  );
  const active = [...days].reverse().filter((d) => d.earnings > 0 || d.orders > 0 || (d.codCollected ?? 0) > 0);
  const listed = showAll ? active : active.slice(0, LIST_PREVIEW);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={[styles.cardIcon, { backgroundColor: '#FFF1E8' }]}>
          <CalendarDays color={authTheme.brand} size={18} />
        </View>
        <Text style={styles.cardTitle}>Day-wise earnings</Text>
        <View style={styles.segment}>
          {([7, 30] as const).map((value) => {
            const on = range === value;
            return (
              <Pressable
                key={value}
                onPress={() => {
                  setSelectedKey(null);
                  onRange(value);
                }}
                style={[styles.segmentBtn, on && styles.segmentOn]}
              >
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{value}D</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.caption}>{error} Tap to retry.</Text>
        </Pressable>
      ) : loading ? (
        <ActivityIndicator color={authTheme.brand} style={{ paddingVertical: 40 }} />
      ) : (
        <>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Earned</Text>
              <Text style={[styles.statValue, { color: '#15803D' }]}>
                {formatCurrency(totals.earned, currency)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Trips</Text>
              <Text style={styles.statValue}>{totals.trips}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>COD collected</Text>
              <Text style={styles.statValue}>{formatCurrency(totals.cod, currency)}</Text>
            </View>
          </View>

          {selected ? (
            <View style={styles.tooltip}>
              <Text style={styles.tooltipDay}>
                {dayLabel(selected.date)} · {selected.orders} trips
                {(selected.codCollected ?? 0) > 0
                  ? ` · COD ${formatCurrency(selected.codCollected, currency)}`
                  : ''}
              </Text>
              <Text style={styles.tooltipValue}>{formatCurrency(selected.earnings, currency)}</Text>
            </View>
          ) : null}

          <View style={styles.chart}>
            {days.map((d) => {
              const on = d.date === selected?.date;
              const height = d.earnings > 0 ? Math.max(6, (d.earnings / max) * 108) : 3;
              return (
                <Pressable
                  key={d.date}
                  onPress={() => setSelectedKey(d.date)}
                  style={styles.barCol}
                  accessibilityLabel={`${dayLabel(d.date)} ${formatCurrency(d.earnings, currency)}`}
                >
                  <View
                    style={[
                      styles.bar,
                      { height, backgroundColor: on ? authTheme.brand : 'rgba(234, 75, 20, 0.22)' },
                    ]}
                  />
                  {range === 7 ? (
                    <Text style={[styles.barLabel, on && styles.barLabelOn]}>{shortDayLabel(d.date)}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {!active.length ? (
            <Text style={styles.empty}>No trips in the last {range} days.</Text>
          ) : (
            <View>
              {listed.map((d) => (
                <View key={d.date} style={styles.dayRow}>
                  <View style={styles.dayCopy}>
                    <Text style={styles.dayTitle}>{dayLabel(d.date)}</Text>
                    <Text style={styles.dayMeta}>
                      {d.orders} {d.orders === 1 ? 'trip' : 'trips'}
                      {(d.tips ?? 0) > 0 ? ` · Tips ${formatCurrency(d.tips, currency)}` : ''}
                      {(d.codCollected ?? 0) > 0 ? ` · COD ${formatCurrency(d.codCollected, currency)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.dayAmount}>{formatCurrency(d.earnings, currency)}</Text>
                </View>
              ))}
              {active.length > LIST_PREVIEW ? (
                <Pressable onPress={() => setShowAll((v) => !v)} style={styles.moreBtn}>
                  <Text style={styles.link}>{showAll ? 'Show less' : `Show all ${active.length} days`}</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </>
      )}
    </View>
  );
}
