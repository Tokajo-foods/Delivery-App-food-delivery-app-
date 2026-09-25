import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useGatewayProbe } from '@/lib/gateway/hooks';
import {
  resolvePostAuthRoute,
  type PostAuthRoute,
} from '@/lib/navigation/post-auth';
import { useAuthStore } from '@/store/auth-store';

type Target = '/login' | PostAuthRoute;

export default function Index() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user);
  const gateway = useGatewayProbe(isHydrated);

  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token) {
      setTarget('/login');
      return;
    }

    let active = true;
    const effectiveRole = user?.role ?? role;

    void resolvePostAuthRoute(effectiveRole)
      .then((route) => {
        if (!active) return;
        setTarget(route);
      })
      .catch(() => {
        if (!active) return;
        setTarget(
          effectiveRole === 'delivery' ? '/delivery' : '/restaurant-setup'
        );
      });

    return () => {
      active = false;
    };
  }, [isHydrated, token, user?.id, user?.role, role]);

  // Cold-start brand splash covers the boot path — no spinner here.
  if (!isHydrated || !target || gateway.reachable == null) {
    return <View style={{ flex: 1, backgroundColor: '#F7EFE4' }} />;
  }

  if (gateway.reachable === false) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F7EFE4',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <Text
          style={{
            color: '#0F172A',
            fontSize: 16,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
            Can{"'"}t reach TOKAJO servers
        </Text>
        <Text
          style={{
            color: '#64748B',
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 20,
          }}
        >
          Check your internet and try again.
        </Text>
        <Pressable
          onPress={gateway.retry}
          disabled={gateway.checking}
          style={{
            backgroundColor: '#EA4B14',
            borderRadius: 999,
            paddingHorizontal: 22,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
            {gateway.checking ? 'Retrying…' : 'Try again'}
          </Text>
        </Pressable>
      </View>
    );
  }

  return <Redirect href={target} />;
}
