import { MessageCircle, Phone } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useOrderCalls } from '@/lib/call/use-order-calls';

type Props = {
  orderId: string;
  customerName: string;
  address: string;
  addressNote?: string;
  fulfillmentLabel: string;
  fulfillmentTone: 'table' | 'delivery' | 'pickup';
  placedLabel: string;
  statusLabel: string;
  statusColor: string;
  prepMinutes?: number;
  onChat: () => void;
};

export function KitchenCustomerCard({
  orderId,
  customerName,
  address,
  addressNote,
  fulfillmentLabel,
  fulfillmentTone,
  placedLabel,
  statusLabel,
  statusColor,
  prepMinutes,
  onChat,
}: Props) {
  const calls = useOrderCalls(orderId, 'restaurant');
  const canReach = fulfillmentTone !== 'table';

  const openCallChoices = () => {
    Alert.alert(customerName, 'Choose how to call', [
      {
        text: 'Phone call',
        onPress: () => void calls.dial('customer'),
      },
      {
        text: 'Internet call',
        onPress: () => void calls.startInternet('customer', customerName),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {customerName}
        </Text>
        {canReach ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Call customer"
              onPress={openCallChoices}
              style={styles.iconBtn}
            >
              <Phone color="#FFFFFF" size={16} />
            </Pressable>
            <Pressable
              accessibilityLabel="Chat with customer"
              onPress={onChat}
              style={styles.iconBtn}
            >
              <MessageCircle color="#FFFFFF" size={16} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {calls.notice ? <Text style={styles.notice}>{calls.notice}</Text> : null}
      {calls.busy ? <ActivityIndicator color={authTheme.brand} /> : null}

      <Text style={styles.label}>Delivery address</Text>
      <Text style={styles.address}>
        {address ||
          (fulfillmentTone === 'pickup'
            ? 'Pickup order'
            : fulfillmentTone === 'table'
              ? fulfillmentLabel
              : 'Address not on this order')}
      </Text>
      {addressNote ? <Text style={styles.note}>{addressNote}</Text> : null}

      <Row label="Order type" value={fulfillmentLabel} />
      <Row label="Placed" value={placedLabel} />
      <Row label="Status" value={statusLabel} valueColor={statusColor} />
      {prepMinutes ? <Row label="Prep time" value={`${prepMinutes} min`} /> : null}
    </View>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    padding: 16,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  name: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: authTheme.text,
  },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#9A3412',
  },
  address: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: authTheme.text,
  },
  note: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: authTheme.textMuted,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
});
