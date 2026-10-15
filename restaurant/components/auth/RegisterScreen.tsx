import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { AuthShell } from '@/components/auth/AuthShell';
import { PhoneSignupFlow } from '@/components/auth/PhoneSignupFlow';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { usePhoneSignup } from '@/components/auth/usePhoneSignup';
import { DeliveryRegisterWizard } from '@/components/delivery/auth/RegisterWizard';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { applyPhoneAuthSession } from '@/lib/auth/phone-session';
import type { PartnerRole } from '@/lib/auth/types';
import { resolvePostAuthRoute } from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

function RestaurantPhoneSignup({
  role,
  setRole,
  initialPhone,
}: {
  role: PartnerRole;
  setRole: (role: PartnerRole) => void;
  initialPhone?: string;
}) {
  const router = useRouter();
  const signup = usePhoneSignup({ role: 'restaurant', initialPhone });
  const [handoff, setHandoff] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setError(null);
    const result = await signup.submit();
    if (!result) return;
    try {
      const linked = result.linkedExistingAccount;
      setHandoff(
        linked
          ? `This number already had a Tokajo account — restaurant access was added.${
              result.passwordSet ? '' : ' Your existing password is unchanged.'
            } Opening restaurant setup…`
          : 'Account created — opening restaurant setup…'
      );
      await new Promise((resolve) => setTimeout(resolve, linked ? 2200 : 420));
      await applyPhoneAuthSession(result, 'restaurant');
      router.replace(await resolvePostAuthRoute('restaurant'));
    } catch (err) {
      setHandoff(null);
      setError(formatAuthError(err, 'Could not open your new account. Sign in to continue.'));
    }
  };

  if (handoff) return <AuthLoadingScreen message={handoff} />;

  return (
    <>
      <RoleSelector value={role} onChange={setRole} disabled={signup.submitting} />
      <AuthBanner type="error" message={error} />
      <PhoneSignupFlow
        signup={signup}
        role="restaurant"
        submitLabel="Create account"
        onSubmit={() => void create()}
      />
    </>
  );
}

export function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; phone?: string; role?: string }>();
  const inviteToken = useMemo(() => {
    const raw = params.token;
    return typeof raw === 'string' ? raw.trim() : '';
  }, [params.token]);
  const initialPhone = typeof params.phone === 'string' ? params.phone : undefined;

  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);

  useEffect(() => {
    if (inviteToken) setRole('delivery');
    else if (params.role === 'delivery' || params.role === 'restaurant') setRole(params.role);
  }, [inviteToken, params.role, setRole]);

  const isDelivery = role === 'delivery' || Boolean(inviteToken);

  return (
    <AuthShell
      title={isDelivery ? 'Join as Delivery Partner' : 'Create account'}
      subtitle={
        isDelivery
          ? inviteToken
            ? 'Validating your restaurant invitation and completing partner signup.'
            : 'Verify your number, then complete the steps below to start delivering.'
          : 'Verify your mobile number to create your restaurant partner account.'
      }
      showBack
      footer={
        <View className="flex-row items-center justify-center">
          <Text className="text-sm text-secondary-light">Already a partner? </Text>
          <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
            <Text className="text-sm font-bold text-primary">Sign in</Text>
          </Pressable>
        </View>
      }
    >
      {isDelivery ? (
        <DeliveryRegisterWizard initialPhone={initialPhone} />
      ) : (
        <RestaurantPhoneSignup role={role} setRole={setRole} initialPhone={initialPhone} />
      )}
    </AuthShell>
  );
}
