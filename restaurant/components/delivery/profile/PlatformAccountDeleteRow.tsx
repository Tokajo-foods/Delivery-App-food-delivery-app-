import { ShieldCheck, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
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
import { useRouter } from 'expo-router';

import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import { getApiErrorCode } from '@/lib/errors';
import { userAccountApi } from '@/lib/user/account-api';
import {
  formatAccountError,
  usePlatformAccountMutations,
} from '@/lib/user/account-hooks';
import { useAuthStore } from '@/store/auth-store';

export function PlatformAccountDeleteRow() {
  const router = useRouter();
  const { deleteAccount } = usePlatformAccountMutations();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [deleting, setDeleting] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState<string | null>(null);

  const onDelete = () => {
    Alert.alert(
      'Delete account?',
      'We’ll check what you’ll lose, then ask you to confirm. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => void runDeletePreview(),
        },
      ]
    );
  };

  const runDeletePreview = async () => {
    setDeleting(true);
    try {
      const preview = await userAccountApi.getDeletePreview();
      const lines = [
        preview.warn?.trim() || null,
        preview.openOrders
          ? `${preview.openOrders} open order(s)`
          : 'No open customer orders',
        `Wallet ${formatCurrency(preview.walletBalance, 'INR')}`,
        preview.activeSubscription ? 'Active subscription on file' : null,
      ]
        .filter(Boolean)
        .join('\n');

      if (!preview.canDelete) {
        Alert.alert(
          'Cannot delete yet',
          lines || 'Finish open work before deleting this account.'
        );
        return;
      }

      Alert.alert('This will permanently delete your account', lines, [
        { text: 'Keep account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDelete(),
        },
      ]);
    } catch (err) {
      Alert.alert(
        'Could not load delete preview',
        formatAccountError(err, 'Try again.')
      );
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = async (otp?: string) => {
    if (otp !== undefined && otp.trim().length < 4) {
      Alert.alert('OTP required', 'Enter the 6-digit code we sent.');
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount.mutateAsync(otp ? { otp } : undefined);
      setDeleteOtp(null);
      await clearSession();
      router.replace('/login');
    } catch (err) {
      if (getApiErrorCode(err) === 'OTP_REQUIRED' && !otp) {
        try {
          const me = useAuthStore.getState().user;
          const identifier = me?.phone || me?.email;
          if (!identifier) throw err;
          await sendOtp({
            emailOrPhone: identifier,
            purpose: 'delete_account',
          });
          setDeleteOtp('');
        } catch (otpErr) {
          Alert.alert(
            'Could not delete account',
            formatAccountError(otpErr, formatAccountError(err, 'Try again.'))
          );
        }
        return;
      }
      Alert.alert(
        'Could not delete account',
        formatAccountError(err, 'Try again.')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={onDelete}
        disabled={deleting}
        style={styles.deleteRow}
      >
        {deleting ? (
          <ActivityIndicator color="#B91C1C" />
        ) : (
          <>
            <View style={styles.deleteIcon}>
              <Trash2 color="#B91C1C" size={16} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deleteLabel}>Delete account</Text>
              <Text style={styles.deleteHint}>
                Preview what you’ll lose, then confirm
              </Text>
            </View>
            <ShieldCheck color="#FECACA" size={16} />
          </>
        )}
      </Pressable>

      <Modal
        visible={deleteOtp != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOtp(null)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setDeleteOtp(null)}
          />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Confirm deletion</Text>
            <Text style={styles.sheetHint}>
              Enter the OTP sent to your phone or email.
            </Text>
            <TextInput
              value={deleteOtp ?? ''}
              onChangeText={(text) =>
                setDeleteOtp(text.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="6-digit OTP"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              style={styles.input}
            />
            <Pressable
              onPress={() => void confirmDelete(deleteOtp ?? '')}
              disabled={deleting}
              style={styles.primaryBtn}
            >
              {deleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Delete account</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => setDeleteOtp(null)}
              style={styles.linkBtn}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: '#B91C1C' },
  deleteHint: { marginTop: 2, fontFamily: fonts.medium, fontSize: 12, color: '#94A3B8' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#00000066' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 10,
  },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 18, color: '#111827' },
  sheetHint: { fontFamily: fonts.medium, fontSize: 13, color: '#6B7280' },
  input: {
    marginTop: 4,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F8FAFC',
  },
  primaryBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  linkBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#6B7280' },
});
