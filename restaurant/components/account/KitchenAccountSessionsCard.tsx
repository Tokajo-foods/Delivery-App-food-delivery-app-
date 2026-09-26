import { MonitorSmartphone, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { getApiErrorCode } from '@/lib/errors';
import {
  formatAccountError,
  usePlatformAccountMutations,
  usePlatformSessions,
} from '@/lib/user/account-hooks';
import type { UserSession } from '@/lib/user/account-types';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'expo-router';

function formatLastSeen(iso?: string) {
  if (!iso) return 'Last seen unknown';
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return iso;
  const diff = Date.now() - at;
  if (diff < 45_000) return 'Active now';
  if (diff < 3_600_000) {
    const mins = Math.max(1, Math.round(diff / 60_000));
    return `${mins} min ago`;
  }
  if (diff < 86_400_000) {
    const hours = Math.max(1, Math.round(diff / 3_600_000));
    return `${hours}h ago`;
  }
  const days = Math.max(1, Math.round(diff / 86_400_000));
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

function sessionHint(session: UserSession) {
  return [session.location, session.ip, formatLastSeen(session.lastSeenAt)]
    .filter(Boolean)
    .join(' · ');
}

export function KitchenAccountSessionsCard() {
  const router = useRouter();
  const sessions = usePlatformSessions(true);
  const { revokeSession } = usePlatformAccountMutations();
  const logoutAll = useAuthStore((s) => s.logoutAll);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const sessionRows = [...(sessions.data ?? [])].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    return (Date.parse(b.lastSeenAt ?? '') || 0) - (Date.parse(a.lastSeenAt ?? '') || 0);
  });

  const afterSignOut = async () => {
    await clearSession();
    router.replace('/login');
  };

  const runRevoke = async (session: UserSession) => {
    setRevokingId(session.id);
    try {
      await revokeSession.mutateAsync(session.id);
      if (session.current) await afterSignOut();
    } catch (error) {
      if (getApiErrorCode(error) === 'SESSION_NOT_FOUND') {
        await sessions.refetch();
        if (session.current) await afterSignOut();
        return;
      }
      Alert.alert(
        'Could not log out device',
        formatAccountError(error, 'Try again.')
      );
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <MonitorSmartphone color={authTheme.brand} size={16} />
        <Text style={styles.cardTitle}>Logged-in devices</Text>
      </View>
      <Text style={styles.meta}>
        Phones that can access this owner login. Log out any you don’t recognise.
      </Text>
      {sessions.isLoading && !sessions.data ? (
        <ActivityIndicator color={authTheme.brand} />
      ) : sessions.isError && !sessions.data ? (
        <Pressable onPress={() => void sessions.refetch()}>
          <Text style={styles.linkText}>
            {formatAccountError(sessions.error, 'Could not load sessions. Retry')}
          </Text>
        </Pressable>
      ) : sessionRows.length === 0 ? (
        <Text style={styles.meta}>Only this phone is signed in.</Text>
      ) : (
        sessionRows.map((session) => (
          <View key={session.id} style={styles.deviceRow}>
            <Smartphone
              color={session.current ? authTheme.brand : authTheme.textMuted}
              size={16}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>
                {session.deviceName}
                {session.current ? ' · this phone' : ''}
              </Text>
              <Text style={styles.meta}>{sessionHint(session)}</Text>
            </View>
            <Pressable
              onPress={() =>
                Alert.alert(
                  session.current
                    ? 'Log out this phone?'
                    : `Log out ${session.deviceName}?`,
                  session.current
                    ? 'You’ll need to sign in again on this phone.'
                    : 'That phone will be signed out immediately.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Log out',
                      style: 'destructive',
                      onPress: () => void runRevoke(session),
                    },
                  ]
                )
              }
              disabled={revokingId === session.id}
            >
              {revokingId === session.id ? (
                <ActivityIndicator color={authTheme.error} size="small" />
              ) : (
                <Text style={styles.dangerLink}>Log out</Text>
              )}
            </Pressable>
          </View>
        ))
      )}
      <Pressable
        onPress={() =>
          Alert.alert(
            'Log out everywhere?',
            'This will end your session on all phones, including this one.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log out all',
                style: 'destructive',
                onPress: () => {
                  void (async () => {
                    setLoggingOutAll(true);
                    try {
                      await logoutAll();
                      await afterSignOut();
                    } catch (error) {
                      Alert.alert(
                        'Could not log out',
                        formatAccountError(error, 'Try again.')
                      );
                    } finally {
                      setLoggingOutAll(false);
                    }
                  })();
                },
              },
            ]
          )
        }
        disabled={loggingOutAll}
        style={styles.linkRow}
      >
        {loggingOutAll ? (
          <ActivityIndicator color={authTheme.error} />
        ) : (
          <Text style={styles.dangerLink}>Log out all devices</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 16,
  },
  rowLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  dangerLink: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.error,
  },
  linkRow: { paddingVertical: 6, alignItems: 'flex-start' },
});
