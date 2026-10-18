import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthShell } from '@/components/auth/AuthShell';
import { FirebasePhoneVerifyCard } from '@/components/auth/FirebasePhoneVerifyCard';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { theme } from '@/constants/theme';
import { signOutFirebase } from '@/lib/auth/firebase-phone';
import { maskPhone } from '@/lib/auth/phone-number';
import { getApiErrorCode } from '@/lib/errors';
import { usePlatformAccountMutations, usePlatformMe } from '@/lib/user/account-hooks';
import { useAuthStore } from '@/store/auth-store';

type Stage = 'current' | 'new' | 'done';

/** Settings: OTP to the current number, then OTP to the new number, then save. */
export function ChangePhoneScreen() {
  const router = useRouter();
  const me = usePlatformMe();
  const storePhone = useAuthStore((s) => s.user?.phone);
  const { verifyCurrentPhone, confirmNewPhone } = usePlatformAccountMutations();
  const [stage, setStage] = useState<Stage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedPhone, setSavedPhone] = useState('');

  const currentPhone = (me.data?.phone || storePhone || '').trim();
  const loading = me.isLoading && !storePhone;
  const activeStage: Stage = stage ?? (currentPhone ? 'current' : 'new');

  const onCurrentVerified = async ({ idToken }: { idToken: string }) => {
    await verifyCurrentPhone.mutateAsync(idToken);
    await signOutFirebase();
    setNotice(null);
    setStage('new');
  };

  const onNewVerified = async ({ idToken, phone }: { idToken: string; phone: string }) => {
    try {
      const user = await confirmNewPhone.mutateAsync(idToken);
      await signOutFirebase();
      setSavedPhone(user.phone || phone);
      setStage('done');
    } catch (err) {
      if (getApiErrorCode(err) !== 'CURRENT_CONTACT_UNVERIFIED') throw err;
      await signOutFirebase();
      setNotice('Verification of your current number expired. Verify it again.');
      setStage('current');
    }
  };

  const subtitle =
    activeStage === 'current'
      ? 'First confirm the number on your account.'
      : activeStage === 'new'
        ? 'Now verify the new number. It will be used for sign-in and OTP.'
        : 'Your phone number has been updated.';

  return (
    <AuthShell title="Change phone number" subtitle={subtitle} showBack>
      <AuthBanner type="error" message={notice} />
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : activeStage === 'current' ? (
        <FirebasePhoneVerifyCard
          key="current"
          initialPhone={currentPhone}
          lockPhone
          phoneLabel="Current number"
          submitLabel="Verify current number"
          onVerified={onCurrentVerified}
        />
      ) : activeStage === 'new' ? (
        <FirebasePhoneVerifyCard
          key="new"
          phoneLabel="New mobile number"
          submitLabel="Verify & update"
          onVerified={onNewVerified}
        />
      ) : (
        <View>
          <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
            <CheckCircle2 color={theme.success} size={18} />
            <Text className="flex-1 text-sm font-semibold text-green-700">
              {savedPhone ? `${maskPhone(savedPhone)} is now your login number.` : 'Phone updated.'}{' '}
              Other devices were signed out.
            </Text>
          </View>
          <PrimaryButton label="Done" onPress={() => router.back()} />
        </View>
      )}
    </AuthShell>
  );
}
