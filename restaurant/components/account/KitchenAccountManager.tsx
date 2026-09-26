import { useRouter } from 'expo-router';
import { ShieldCheck, Trash2, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { KitchenAccountContactCard } from '@/components/account/KitchenAccountContactCard';
import { KitchenAccountPrefsCard } from '@/components/account/KitchenAccountPrefsCard';
import { KitchenAccountProfileCard } from '@/components/account/KitchenAccountProfileCard';
import { KitchenAccountSessionsCard } from '@/components/account/KitchenAccountSessionsCard';
import { kitchenAccountStyles as styles } from '@/components/account/kitchen-account-styles';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorCode } from '@/lib/errors';
import { userAccountApi } from '@/lib/user/account-api';
import {
  formatAccountError,
  platformAccountKeys,
  usePlatformAccountMutations,
  usePlatformMe,
  usePlatformPreferences,
  usePlatformSessions,
} from '@/lib/user/account-hooks';
import { useAuthStore } from '@/store/auth-store';
import { useQueryClient } from '@tanstack/react-query';

export function KitchenAccountManager() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = usePlatformMe(true);
  const prefs = usePlatformPreferences(true);
  const sessions = usePlatformSessions(true);
  const mutations = usePlatformAccountMutations();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [deleting, setDeleting] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState<string | null>(null);
  const user = me.data;

  const refresh = async () => {
    await Promise.all([
      me.refetch(),
      prefs.refetch(),
      sessions.refetch(),
      queryClient.invalidateQueries({ queryKey: platformAccountKeys.all }),
    ]);
  };

  const afterSignOut = async () => {
    await clearSession();
    router.replace('/login');
  };

  const runDeletePreview = async () => {
    setDeleting(true);
    try {
      const preview = await userAccountApi.getDeletePreview();
      const lines = [
        preview.warn?.trim() || null,
        preview.openOrders
          ? `${preview.openOrders} open order(s) still need to finish`
          : 'No open customer orders',
        'Your owner login, photo, and signed-in phones will be removed.',
        'Outlet listing and KYC stay with ops until they close the restaurant.',
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

      Alert.alert('Delete this account permanently?', lines, [
        { text: 'Keep account', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDelete(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Could not load delete preview',
        formatAccountError(error, 'Try again.')
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
      await mutations.deleteAccount.mutateAsync(otp ? { otp } : undefined);
      setDeleteOtp(null);
      await afterSignOut();
    } catch (error) {
      if (getApiErrorCode(error) === 'OTP_REQUIRED' && !otp) {
        try {
          const identifier = user?.phone || user?.email;
          if (!identifier) throw error;
          await sendOtp({
            emailOrPhone: identifier,
            purpose: 'delete_account',
          });
          setDeleteOtp('');
        } catch (otpErr) {
          Alert.alert(
            'Could not delete account',
            formatAccountError(otpErr, formatAccountError(error, 'Try again.'))
          );
        }
        return;
      }
      Alert.alert(
        'Could not delete account',
        formatAccountError(error, 'Try again.')
      );
    } finally {
      setDeleting(false);
    }
  };

  const loading = me.isLoading && !user;

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader
        title="Your account"
        subtitle="Login, phone, email, and preferences"
        showBack
        hideProfile
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={me.isRefetching}
            onRefresh={() => void refresh()}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={authTheme.brand} size="large" />
          </View>
        ) : me.isError && !user ? (
          <View style={styles.empty}>
            <Text style={styles.errorText}>
              {formatAccountError(me.error, 'Could not load your account')}
            </Text>
            <PrimaryButton label="Retry" onPress={() => void refresh()} />
          </View>
        ) : user ? (
          <>
            <KitchenAccountProfileCard user={user} />
            <KitchenAccountContactCard
              phone={user.phone}
              email={user.email}
              emailVerified={user.emailVerified}
            />
            <KitchenAccountPrefsCard />
            <KitchenAccountSessionsCard />
            <Pressable
              onPress={() =>
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
                )
              }
              disabled={deleting}
              style={styles.deleteCard}
            >
              {deleting ? (
                <ActivityIndicator color={authTheme.error} />
              ) : (
                <>
                  <View style={styles.deleteIcon}>
                    <Trash2 color={authTheme.error} size={16} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deleteLabel}>Delete account</Text>
                    <Text style={styles.meta}>
                      Preview what you’ll lose, then confirm
                    </Text>
                  </View>
                  <ShieldCheck color="#FECACA" size={16} />
                </>
              )}
            </Pressable>
          </>
        ) : (
          <View style={styles.empty}>
            <UserRound color={authTheme.textMuted} size={28} />
            <Text style={styles.emptyTitle}>No account loaded</Text>
            <PrimaryButton label="Retry" onPress={() => void refresh()} />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={deleteOtp != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOtp(null)}
      >
        <View style={styles.otpOverlay}>
          <Pressable
            style={styles.otpBackdrop}
            onPress={() => setDeleteOtp(null)}
          />
          <View style={styles.otpSheet}>
            <Text style={styles.cardTitle}>Confirm deletion</Text>
            <Text style={styles.meta}>
              Enter the OTP sent to your phone or email.
            </Text>
            <TextInput
              value={deleteOtp ?? ''}
              onChangeText={(text) =>
                setDeleteOtp(text.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="6-digit OTP"
              placeholderTextColor={authTheme.textDim}
              keyboardType="number-pad"
              style={styles.input}
            />
            <PrimaryButton
              label="Delete account"
              loading={deleting}
              onPress={() => void confirmDelete(deleteOtp ?? '')}
            />
            <Pressable
              onPress={() => setDeleteOtp(null)}
              style={styles.linkRow}
            >
              <Text style={styles.meta}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
