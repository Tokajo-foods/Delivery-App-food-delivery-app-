import {
  Bike,
  Phone,
  Star,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useOrderCalls } from '@/lib/call/use-order-calls';
import { getApiErrorMessage } from '@/lib/errors';
import type { KitchenRider } from '@/lib/order/owner-api';
import { displayStatus } from '@/lib/order/ui';

type Props = {
  orderId: string;
  rider?: KitchenRider;
  loading?: boolean;
  error?: unknown;
  canRate?: boolean;
  onRetry: () => void;
  onRate: () => void;
};

function dutyLabel(rider: KitchenRider) {
  const raw = rider.dutyStatus || rider.status || '';
  if (!raw) return rider.isOnline ? 'Online' : null;
  if (raw.toLowerCase().includes('return')) return 'Returning to store';
  if (raw.toLowerCase().includes('arrived')) return 'At the store';
  if (raw.toLowerCase() === 'searching') return 'Searching';
  return displayStatus(raw);
}

export function KitchenRiderCard({
  orderId,
  rider,
  loading,
  error,
  canRate,
  onRetry,
  onRate,
}: Props) {
  const assigned = Boolean(rider?.assigned && (rider.name || rider.partnerId));
  const searching = !assigned && (rider?.searching === true || Boolean(rider?.message));
  const calls = useOrderCalls(assigned ? orderId : '', 'restaurant');
  const riderName = rider?.name?.trim() || 'Delivery partner';

  const openCallChoices = () => {
    Alert.alert(riderName, 'Choose how to call', [
      { text: 'Internet call', onPress: () => void calls.startInternet('rider', riderName) },
      { text: 'Normal call', onPress: () => void calls.dial('rider') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Bike color={authTheme.brand} size={16} />
        <Text style={styles.title}>Delivery partner</Text>
      </View>

      {loading && !rider && !searching ? (
        <ActivityIndicator color={authTheme.brand} />
      ) : error && !assigned && !searching ? (
        <>
          <Text style={styles.error}>{getApiErrorMessage(error)}</Text>
          <Pressable onPress={onRetry} style={styles.ghost}>
            <Text style={styles.ghostText}>Retry</Text>
          </Pressable>
        </>
      ) : assigned ? (
        <>
          <Text style={styles.name}>{rider?.name || 'Rider'}</Text>
          <Text style={styles.meta}>
            {[
              rider?.isFleetPartner ? 'Your rider' : 'Platform rider',
              rider?.vehicleType,
              rider?.vehicleNumber,
              rider?.avgRating != null ? `${rider.avgRating.toFixed(1)}★` : null,
              dutyLabel(rider!),
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={styles.hint}>
            Calls use a Tokajo number. Your mobile stays hidden.
          </Text>
        </>
      ) : (
        <View style={styles.finding}>
          <ActivityIndicator color={authTheme.brand} />
          <View style={styles.findingCopy}>
            <Text style={styles.emptyTitle}>Finding a rider…</Text>
            <Text style={styles.hint}>
              {rider?.message
                || (rider?.searchRadiusKm
                  ? `Searching within ${rider.searchRadiusKm} km`
                  : 'Platform dispatch is matching the nearest available rider.')}
            </Text>
          </View>
        </View>
      )}

      {assigned && calls.notice ? <Text style={styles.error}>{calls.notice}</Text> : null}

      <View style={styles.actions}>
        {assigned ? (
          <Pressable
            accessibilityLabel="Call delivery partner"
            disabled={Boolean(calls.busy)}
            onPress={openCallChoices}
            style={[styles.action, styles.callAction, calls.busy ? styles.disabled : null]}
          >
            {calls.busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Phone color="#FFFFFF" size={15} />
            )}
            <Text style={[styles.actionText, styles.callText]}>Call rider</Text>
          </Pressable>
        ) : null}
        {canRate && assigned ? (
          <Pressable onPress={onRate} style={styles.action}>
            <Star color="#D97706" size={15} />
            <Text style={styles.actionText}>Rate pickup</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: authTheme.text,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 17,
  },
  phone: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.text,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 17,
  },
  finding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  findingCopy: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.error,
  },
  ghost: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  ghostText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  action: {
    flexGrow: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: authTheme.surface,
  },
  actionText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.text,
  },
  callAction: { backgroundColor: '#EA4B14' },
  callText: { color: '#FFFFFF' },
  disabled: { opacity: 0.5 },
});
