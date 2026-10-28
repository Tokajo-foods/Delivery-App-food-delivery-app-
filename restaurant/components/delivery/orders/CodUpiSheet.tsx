import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { doorstepPayStyles as styles } from '@/components/delivery/orders/doorstep-pay-styles';
import { useDoorstepPay } from '@/components/delivery/orders/use-doorstep-pay';
import { formatInr } from '@/lib/format/money';

type Props = {
  visible: boolean;
  deliveryId: string | null;
  amount?: number | null;
  onClose: () => void;
  onCompleted: () => void;
};

export function CodUpiSheet({
  visible,
  deliveryId,
  amount,
  onClose,
  onCompleted,
}: Props) {
  const insets = useSafeAreaInsets();
  const pay = useDoorstepPay({ visible, deliveryId, amount, onCompleted });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>Cash on delivery</Text>
              <Text style={styles.title}>
                {pay.phase === 'done' ? 'Delivery complete' : 'Collect payment'}
              </Text>
            </View>
            {pay.phase !== 'done' ? (
              <Pressable onPress={onClose} hitSlop={8} style={styles.close}>
                <X color="#6B7280" size={18} />
              </Pressable>
            ) : null}
          </View>

          {pay.phase === 'done' ? (
            <Text style={styles.body}>
              The customer’s payment is recorded. You can take the next order.
            </Text>
          ) : pay.loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#EA4B14" />
              <Text style={styles.body}>
                {pay.phase === 'working' ? 'Updating the trip…' : 'Preparing the QR…'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.amount}>
                {pay.due != null ? formatInr(pay.due) : '—'}
              </Text>
              <Text style={styles.body}>
                This is the exact amount on the customer’s order. Ask them to scan and pay.
                The trip completes on its own when the payment arrives.
              </Text>

              {pay.loadError ? <Text style={styles.error}>{pay.loadError}</Text> : null}
              {pay.cashError ? <Text style={styles.error}>{pay.cashError}</Text> : null}

              {pay.imageUrl && !pay.loadError ? (
                <View style={styles.qrCard}>
                  <Image source={{ uri: pay.imageUrl }} style={styles.qr} />
                </View>
              ) : null}

              {pay.expired ? (
                <Pressable onPress={pay.refreshQr} style={styles.secondary}>
                  <Text style={styles.secondaryText}>Refresh QR</Text>
                </Pressable>
              ) : pay.imageUrl ? (
                <Text style={styles.hint}>Waiting for payment</Text>
              ) : null}

              {pay.loadError ? (
                <Pressable onPress={pay.refreshQr} style={styles.secondary}>
                  <Text style={styles.secondaryText}>Try QR again</Text>
                </Pressable>
              ) : null}

              <Pressable onPress={pay.onCash} style={styles.primary}>
                <Text style={styles.primaryText}>Paid in cash</Text>
              </Pressable>
              <Text style={styles.hint}>
                Use cash only when you have the notes. A QR payment still completes the trip by itself.
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
