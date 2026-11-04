import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { useAppPermissions } from '@/lib/permissions/use-app-permissions';
import type { PermissionId } from '@/lib/permissions/types';

type Props = {
  enabled: boolean;
};

function statusLabel(status: string, blocked: boolean): string {
  if (status === 'granted') return 'Allowed';
  if (blocked) return 'Blocked in Settings';
  return 'Not allowed yet';
}

export function AppPermissionsGate({ enabled }: Props) {
  const insets = useSafeAreaInsets();
  const { rows, loading, requesting, allGranted, requestOne, requestAll, needsGate } =
    useAppPermissions();
  const [softDismiss, setSoftDismiss] = useState(false);

  useEffect(() => {
    if (!allGranted && enabled) setSoftDismiss(false);
  }, [allGranted, enabled, rows]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !allGranted) setSoftDismiss(false);
    });
    return () => sub.remove();
  }, [enabled, allGranted]);

  const visible = enabled && needsGate && !softDismiss;

  if (!visible) return null;

  const onOpenSettings = () => {
    void Linking.openSettings();
  };

  const onAllowOne = (id: PermissionId) => {
    void requestOne(id);
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[styles.wrap, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.kicker}>Before you start</Text>
        <Text style={styles.title}>Allow app permissions</Text>
        <Text style={styles.lead}>
          TOKAJO needs a few permissions for orders, calls, and live delivery. If you change them
          later in phone Settings, this screen appears again until everything is allowed.
        </Text>

        {loading ? (
          <ActivityIndicator color={authTheme.brand} style={styles.loader} />
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {rows.map((row) => {
              const allowed = row.status === 'granted';
              return (
                <View key={row.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Text style={styles.cardTitle}>{row.title}</Text>
                    <Text
                      style={[
                        styles.badge,
                        allowed ? styles.badgeOk : styles.badgeWarn,
                      ]}
                    >
                      {statusLabel(row.status, row.blocked)}
                    </Text>
                  </View>
                  <Text style={styles.cardReason}>{row.reason}</Text>
                  {!allowed ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.rowBtn,
                        pressed && styles.rowBtnPressed,
                      ]}
                      disabled={requesting}
                      onPress={() =>
                        row.blocked ? onOpenSettings() : onAllowOne(row.id)
                      }
                    >
                      <Text style={styles.rowBtnText}>
                        {row.blocked ? 'Open Settings' : 'Allow'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.footer}>
          {!allGranted ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                disabled={requesting || loading}
                onPress={() => void requestAll()}
              >
                <Text style={styles.primaryBtnText}>Allow all</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
                onPress={() => setSoftDismiss(true)}
              >
                <Text style={styles.secondaryBtnText}>Not now</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
              onPress={() => setSoftDismiss(true)}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: authTheme.bg,
    paddingHorizontal: 22,
  },
  kicker: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: authTheme.text,
    marginBottom: 10,
  },
  lead: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: authTheme.textMuted,
    marginBottom: 16,
  },
  loader: { marginVertical: 24 },
  list: { flex: 1 },
  listContent: { paddingBottom: 12, gap: 12 },
  card: {
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 16,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: authTheme.text,
  },
  badge: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeOk: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  badgeWarn: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  cardReason: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: authTheme.textMuted,
  },
  rowBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: authTheme.brandSoft,
  },
  rowBtnPressed: { opacity: 0.85 },
  rowBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.brand,
  },
  footer: { gap: 10, paddingTop: 8 },
  primaryBtn: {
    backgroundColor: authTheme.brand,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnPressed: { opacity: 0.9 },
  primaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#fff',
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnPressed: { opacity: 0.7 },
  secondaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: authTheme.textMuted,
  },
});
