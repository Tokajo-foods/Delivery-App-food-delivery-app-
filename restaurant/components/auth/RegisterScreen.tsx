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
import { lockedPartnerRole } from '@/lib/app-variant';
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
  const create = async () => {
    setError(null);
    const result = await signup.submit();
    if (!result) return;
    try {
      const linked = result.linkedExistingAccount;
      setHandoff(
        linked
          ? `This number already has a TOKAJO account. Access was added.${
              result.passwordSet ? '' : ' Your existing password is unchanged.'
            } Taking you in…`
          : 'Account created. Taking you in…'
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
  const params = useLocalSearchParams<{
    token?: string;
    phone?: string;
    role?: string;
    link?: string;
  }>();
  const inviteToken = useMemo(() => {
    const raw = params.token;
    return typeof raw === 'string' ? raw.trim() : '';
  }, [params.token]);
  const initialPhone = typeof params.phone === 'string' ? params.phone : undefined;

  const role = useAuthStore((s) => s.role);
  const setRole = useAuthStore((s) => s.setRole);

  const lockedRole = lockedPartnerRole();

  useEffect(() => {
    if (inviteToken) setRole('delivery');
    else if (lockedRole) setRole(lockedRole);
    else if (params.role === 'delivery' || params.role === 'restaurant') setRole(params.role);
  }, [inviteToken, lockedRole, params.role, setRole]);

  const isDelivery = role === 'delivery' || Boolean(inviteToken);
  const linkingExisting = params.link === '1' && !isDelivery;

  return (
    <AuthShell
      title={isDelivery ? 'Join as a delivery partner' : 'Create your account'}
      subtitle={
        isDelivery
          ? 'Verify your mobile number to create your rider account. Address and vehicle come next.'
          : linkingExisting
            ? 'This number already has a TOKAJO account. Confirm the code and restaurant access is added to it. The email already on this number stays.'
            : 'Enter your mobile number. We’ll send a one-time code to confirm it’s you.'
      }
      showBack
      footer={
        <View>
          <View className="flex-row items-center justify-center">
            <Text className="text-sm text-secondary-light">Already have an account? </Text>
            <Pressable
              onPress={() => router.replace('/login')}
              hitSlop={8}
              accessibilityRole="link"
            >
              <Text className="text-sm font-bold text-primary underline">Sign in</Text>
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
