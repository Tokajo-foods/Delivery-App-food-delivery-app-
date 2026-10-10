import { Package } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import {
  deliveryStatusLabel,
  isUnpaidTripStatus,
  normalizeDeliveryStatus,
} from '@/lib/delivery-partner/api';
import { formatTripError } from '@/lib/delivery-partner/rider-ack';
import type { PartnerDelivery } from '@/lib/delivery-partner/types';

type Props = {
  items: PartnerDelivery[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onOpen: (item: PartnerDelivery) => void;
};

export function HomeDeliveryHistory({ items, loading, error, onRetry, onOpen }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Delivery history</Text>
      <Text style={styles.sub}>Your latest trips</Text>

      {loading && !items.length ? (
        <View style={styles.card}>
          <ActivityIndicator color={authTheme.brand} style={styles.pad} />
        </View>
      ) : error && !items.length ? (
        <Pressable onPress={onRetry} style={styles.card}>
          <Text style={styles.emptyText}>
            {formatTripError(error, 'Could not load history. Retry')}
          </Text>
        </Pressable>
      ) : items.length ? (
        <View style={styles.card}>
          {items.map((item, index) => (
            <HistoryRow
              key={item.id}
              item={item}
              first={index === 0}
              onPress={() => onOpen(item)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Package color="#94A3B8" size={20} />
          <Text style={styles.emptyTitle}>No deliveries yet</Text>
          <Text style={styles.emptyText}>Finished trips will show up here</Text>
        </View>
      )}
    </View>
  );
}

function HistoryRow({
  item,
  first,
  onPress,
}: {
  item: PartnerDelivery;
  first: boolean;
  onPress: () => void;
}) {
  const tone = statusTone(item.status);
  const pay = payLabel(item);
  const when = whenLabel(item);
  const place = item.restaurantName?.trim() || 'Restaurant';
  const customer = item.customerName?.trim();

  return (
    <Pressable onPress={onPress} style={[styles.row, !first && styles.rowBorder]}>
      <View style={styles.body}>
        <Text style={styles.place} numberOfLines={1}>
          {place}
        </Text>
        <Text style={styles.route} numberOfLines={1}>
          {customer ? `To ${customer}` : 'Customer drop-off'}
          {when ? `  ·  ${when}` : ''}
        </Text>
        <View style={[styles.pill, { backgroundColor: tone.bg }]}>
          <Text style={[styles.pillText, { color: tone.fg }]}>
            {deliveryStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <Text style={[styles.pay, !pay && styles.payMuted]}>{pay ?? 'No pay'}</Text>
    </Pressable>
  );
}

function statusTone(status: string) {
  const key = normalizeDeliveryStatus(status);
  if (key === 'delivered') return { fg: '#15803D', bg: '#DCFCE7' };
  if (key === 'returned') return { fg: '#1D4ED8', bg: '#DBEAFE' };
  if (key === 'cancelled' || key === 'failed' || key === 'rejected' || key === 'reassigned') {
    return { fg: '#B91C1C', bg: '#FEE2E2' };
  }
  return { fg: '#C2410C', bg: '#FFF1E8' };
}

function payLabel(item: PartnerDelivery) {
  if (isUnpaidTripStatus(item.status)) return null;
  if (item.earning == null || !Number.isFinite(item.earning)) return null;
  return formatCurrency(item.earning, item.currency);
}

function whenLabel(item: PartnerDelivery) {
  const raw = item.deliveredAt || item.returnedAt || item.failedAt || item.updatedAt || item.createdAt;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return `Today, ${time}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${day}, ${time}`;
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#0F172A',
  },
  sub: {
    marginTop: -4,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    overflow: 'hidden',
  },
  pad: { marginVertical: 22 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  body: { flex: 1, minWidth: 0, gap: 4 },
  place: { fontFamily: fonts.bold, fontSize: 15, color: '#0F172A' },
  route: { fontFamily: fonts.medium, fontSize: 13, color: '#64748B' },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: { fontFamily: fonts.semiBold, fontSize: 11 },
  pay: { fontFamily: fonts.bold, fontSize: 15, color: '#0F172A' },
  payMuted: { fontFamily: fonts.medium, fontSize: 12, color: '#94A3B8' },
  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: '#0F172A' },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
