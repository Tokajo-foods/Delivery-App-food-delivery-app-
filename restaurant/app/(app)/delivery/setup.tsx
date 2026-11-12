import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth/AuthShell';
import { DeliveryRegisterWizard } from '@/components/delivery/auth/RegisterWizard';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { deliveryPartnerApi } from '@/lib/delivery-partner/api';
import { peekFreshRiderSignup } from '@/lib/delivery-partner/fresh-signup';
import { useAuthStore } from '@/store/auth-store';

/**
 * Shown when GET /partners/me is 404 — rider profile not created for this login yet.
 */
export default function DeliverySetupRoute() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const authUser = useAuthStore((s) => s.user);
  const router = useRouter();
  const [fresh] = useState(peekFreshRiderSignup);
  const [wizardActions, setWizardActions] = useState<ReactNode>(null);
  const provisionedRef = useRef(false);

  useEffect(() => {
    if (provisionedRef.current) return;
    const firstName = authUser?.firstName?.trim();
    const phone = authUser?.phone?.trim();
    if (!firstName || firstName.length < 2 || !phone) return;
    provisionedRef.current = true;
    void deliveryPartnerApi
      .provisionProfile({
        firstName,
        lastName: authUser?.lastName?.trim(),
        phone,
        email: authUser?.email?.trim(),
      })
      .catch(() => {
        provisionedRef.current = false;
      });
  }, [authUser?.email, authUser?.firstName, authUser?.id, authUser?.lastName, authUser?.phone]);

  const onWizardFooter = useCallback((node: ReactNode) => {
    setWizardActions(node);
  }, []);

  const onLogout = async () => {
    await clearSession();
    router.replace({
      pathname: '/login',
      params: { role: 'delivery' },
    } as never);
  };

  const shellFooter = (
    <View style={{ gap: 10 }}>
      {wizardActions}
      <Pressable onPress={() => void onLogout()} style={{ paddingVertical: 4 }}>
        <Text
          style={{
            color: authTheme.textMuted,
            fontFamily: fonts.medium,
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          Sign in with a different account
        </Text>
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <AuthShell
        layout="fullscreen"
        title="Partner profile"
        subtitle="Complete your delivery partner profile to access the rider application."
        footer={shellFooter}
        footerScrollInset={172}
      >
        <DeliveryRegisterWizard inviteToken={fresh?.inviteToken} onFooterChange={onWizardFooter} />
      </AuthShell>
    </View>
  );
}
