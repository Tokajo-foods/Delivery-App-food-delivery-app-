import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthBanner } from '@/components/auth/AuthBanner';
import { LegalFooter } from '@/components/auth/AuthExtras';
import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';
import { AuthShell } from '@/components/auth/AuthShell';
import { PhoneSignupFlow } from '@/components/auth/PhoneSignupFlow';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { usePhoneSignup } from '@/components/auth/usePhoneSignup';
import { formatAuthError } from '@/lib/auth/auth-error-copy';
import { applyPhoneAuthSession } from '@/lib/auth/phone-session';
import type { PartnerRole } from '@/lib/auth/types';
import { markFreshRiderSignup } from '@/lib/delivery-partner/fresh-signup';
import { resolvePostAuthRoute } from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

function PartnerPhoneSignup({
  role,
  setRole,
  initialPhone,
  inviteToken,
}: {
  role: PartnerRole;
  setRole: (role: PartnerRole) => void;
  initialPhone?: string;
  inviteToken?: string;
}) {
  const router = useRouter();
  const signup = usePhoneSignup({ role, initialPhone });
  const [handoff, setHandoff] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = role === 'delivery' ? 'rider setup' : 'restaurant setup';

  const create = async () => {
    setError(null);
    const result = await signup.submit();
    if (!result) return;
    try {
      const linked = result.linkedExistingAccount;
      setHandoff(
        linked
          ? `This number already had a Tokajo account. ${
              role === 'delivery' ? 'Delivery' : 'Restaurant'
            } access was added.${
              result.passwordSet ? '' : ' Your existing password is unchanged.'
            } Opening ${next}…`
          : `Account created. Opening ${next}…`
      );
      await new Promise((resolve) => setTimeout(resolve, linked ? 2200 : 420));
      if (role === 'delivery') markFreshRiderSignup(inviteToken);
      await applyPhoneAuthSession(result, role);
      router.replace(await resolvePostAuthRoute(role));
    } catch (err) {
      setHandoff(null);
      setError(formatAuthError(err, 'Could not open your new account. Sign in to continue.'));
    }
  };

  if (handoff) return <AuthLoadingScreen message={handoff} />;

  return (
    <>
      {!inviteToken ? (
        <RoleSelector value={role} onChange={setRole} disabled={signup.submitting} />
      ) : null}
      <AuthBanner type="error" message={error} />
      <PhoneSignupFlow
        signup={signup}
        role={role}
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
          ? 'Verify your mobile number to create your rider account. Address and vehicle come next.'
          : 'Verify your mobile number to create your restaurant partner account.'
      }
      showBack
      footer={
        <View>
          <View className="flex-row items-center justify-center">
            <Text className="text-sm text-secondary-light">Already a partner? </Text>
            <Pressable onPress={() => router.replace('/login')} hitSlop={8}>
              <Text className="text-sm font-bold text-primary">Sign in</Text>
            </Pressable>
          </View>
          <LegalFooter />
        </View>
      }
    >
      <PartnerPhoneSignup
        key={isDelivery ? 'delivery' : 'restaurant'}
        role={isDelivery ? 'delivery' : 'restaurant'}
        setRole={setRole}
        initialPhone={initialPhone}
        inviteToken={inviteToken || undefined}
      />
    </AuthShell>
  );
}
