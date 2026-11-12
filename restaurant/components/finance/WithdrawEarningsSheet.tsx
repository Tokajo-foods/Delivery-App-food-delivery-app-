import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import { useWithdrawRestaurantEarnings } from '@/lib/restaurant/finance-hooks';

const UPI = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/i;

type Props = {
  visible: boolean;
  available: number;
  onClose: () => void;
};

export function WithdrawEarningsSheet({ visible, available, onClose }: Props) {
  const withdraw = useWithdrawRestaurantEarnings();
  const [amountText, setAmountText] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (visible) {
      setAmountText(available > 0 ? String(available) : '');
      setUpiId('');
    }
  }, [visible, available]);

  const amount = Number(amountText);
  const validAmount = Number.isFinite(amount) && amount >= 1 && amount <= available + 0.001;
  const validUpi = UPI.test(upiId.trim());
  const canSubmit = validAmount && validUpi && !withdraw.isPending && available >= 1;

  const submit = () => {
    if (!canSubmit) return;
    const rounded = Math.round(amount * 100) / 100;
    void withdraw
      .mutateAsync({
        amount: rounded,
        upiId: upiId.trim(),
        idempotencyKey: `wd:${rounded}:${upiId.trim().toLowerCase()}:${Date.now()}`,
      })
      .then((result) => {
        const status = result.payout.status;
        const copy =
          status === 'paid'
            ? `${formatCurrency(result.payout.netAmount)} sent to ${result.payout.upiId ?? 'your UPI'}.`
            : status === 'failed'
              ? result.payout.failureReason
                || 'UPI transfer failed. The amount is back in your remaining balance.'
              : `${formatCurrency(result.payout.netAmount)} is processing to ${result.payout.upiId ?? 'your UPI'}.`;
        Alert.alert(
          status === 'failed' ? 'Withdrawal failed' : 'Withdrawal started',
          copy
        );
        onClose();
      })
      .catch((error) => {
        Alert.alert(
          'Could not withdraw',
          error instanceof Error ? error.message : 'Try again'
        );
      });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Withdraw to UPI</Text>
          <Text style={styles.copy}>
            You can withdraw anytime when you have balance (min ₹1). Up to{' '}
            {formatCurrency(available)} is available now. Enter amount and UPI id — transfer is
            sent via RazorpayX (usually within minutes).
          </Text>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmountText}
            placeholder="0"
            placeholderTextColor={authTheme.textDim}
            style={styles.input}
            value={amountText}
          />
          <Pressable onPress={() => setAmountText(String(available))} style={styles.max}>
            <Text style={styles.maxText}>Use full remaining</Text>
          </Pressable>
          <Text style={styles.label}>UPI id</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setUpiId}
            placeholder="name@oksbi"
            placeholderTextColor={authTheme.textDim}
            style={styles.input}
            value={upiId}
          />
          <Pressable
            disabled={!canSubmit}
            onPress={submit}
            style={[styles.go, !canSubmit && styles.goOff]}
          >
            {withdraw.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.goText}>Send to UPI</Text>
            )}
          </Pressable>
          <Pressable disabled={withdraw.isPending} onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    borderRadius: 18,
    backgroundColor: authTheme.surface,
    padding: 18,
    gap: 8,
  },
  title: { fontFamily: fonts.semibold, fontSize: 18, color: authTheme.text },
  copy: { fontFamily: fonts.regular, fontSize: 13, color: authTheme.textMuted, lineHeight: 18 },
  label: { marginTop: 6, fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  input: {
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: authTheme.text,
  },
  max: { alignSelf: 'flex-start' },
  maxText: { fontFamily: fonts.medium, fontSize: 13, color: authTheme.brand },
  go: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
    paddingVertical: 13,
    alignItems: 'center',
  },
  goOff: { opacity: 0.45 },
  goText: { fontFamily: fonts.semibold, fontSize: 15, color: '#FFFFFF' },
  cancel: {
    textAlign: 'center',
    paddingVertical: 8,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: authTheme.textMuted,
  },
});
