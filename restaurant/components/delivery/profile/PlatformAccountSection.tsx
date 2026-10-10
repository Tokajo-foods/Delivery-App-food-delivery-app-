export { ContactChangeModal } from '@/components/account/ContactChangeModal';

import { Bell, Mail, Phone } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { PlatformAccountDeleteRow } from '@/components/delivery/profile/PlatformAccountDeleteRow';
import { fonts } from '@/constants/typography';
import {
  getRiderAlertPrefs,
  saveRiderAlertPrefs,
} from '@/lib/delivery-partner/rider-alert-prefs';
import {
  formatAccountError,
  usePlatformAccountMutations,
  usePlatformPreferences,
} from '@/lib/user/account-hooks';
import type { NotificationPrefs } from '@/lib/user/account-types';

const DEFAULT_PREFS: NotificationPrefs = {
  push: true,
  sms: true,
  email: true,
};

export function PlatformAccountSection() {
  const prefs = usePlatformPreferences(true);
  const { updateNotifications } = usePlatformAccountMutations();
  const [local, setLocal] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<keyof NotificationPrefs | null>(
    null
  );
  const riderLoaded = useRef(false);

  useEffect(() => {
    let live = true;
    void getRiderAlertPrefs()
      .then((rider) => {
        if (!live || !rider) return;
        riderLoaded.current = true;
        setLocal(rider);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (riderLoaded.current) return;
    if (prefs.data?.notifications) setLocal(prefs.data.notifications);
  }, [prefs.data?.notifications]);

  const patchNotifications = async (
    key: keyof NotificationPrefs,
    value: boolean
  ) => {
    const previous = local;
    const next = { ...local, [key]: value };
    setLocal(next);
    setPrefsError(null);
    setSavingKey(key);
    try {
      await saveRiderAlertPrefs(next);
      riderLoaded.current = true;
      const saved = await updateNotifications.mutateAsync(next);
      setLocal(saved.notifications);
    } catch (err) {
      setLocal(previous);
      setPrefsError(
        formatAccountError(err, 'Could not save notification prefs.')
      );
    } finally {
      setSavingKey(null);
    }
  };

  const requestChange = (key: keyof NotificationPrefs, value: boolean) => {
    if (value) {
      void patchNotifications(key, true);
      return;
    }
    const copy =
      key === 'push'
        ? {
            title: 'Turn off push alerts?',
            body: 'Order and duty alerts will not show on this phone.',
          }
        : key === 'sms'
          ? {
              title: 'Turn off SMS?',
              body: 'Text messages will not be sent to you.',
            }
          : {
              title: 'Turn off email?',
              body: 'Email alerts will not be sent to you.',
            };
    Alert.alert(copy.title, copy.body, [
      { text: 'Keep on', style: 'cancel' },
      {
        text: 'Turn off',
        style: 'destructive',
        onPress: () => void patchNotifications(key, false),
      },
    ]);
  };

  return (
    <View style={styles.section}>
      {prefs.isLoading && !prefs.data ? (
        <ActivityIndicator color="#EA4B14" style={{ marginVertical: 18 }} />
      ) : prefs.isError && !prefs.data ? (
        <Pressable onPress={() => void prefs.refetch()} style={styles.retry}>
          <Text style={styles.retryText}>
            {formatAccountError(prefs.error, 'Could not load alerts. Retry')}
          </Text>
        </Pressable>
      ) : (
        <>
          <PrefToggle
            first
            icon={Bell}
            label="Push"
            hint="New orders and duty alerts"
            value={local.push}
            busy={savingKey === 'push'}
            onChange={(push) => requestChange('push', push)}
          />
          <PrefToggle
            icon={Phone}
            label="SMS"
            hint="Codes and account messages"
            value={local.sms}
            busy={savingKey === 'sms'}
            onChange={(sms) => requestChange('sms', sms)}
          />
          <PrefToggle
            icon={Mail}
            label="Email"
            hint="Receipts and account mail"
            value={local.email}
            busy={savingKey === 'email'}
            onChange={(email) => requestChange('email', email)}
          />
        </>
      )}
      {prefsError ? <Text style={styles.error}>{prefsError}</Text> : null}
      <View style={styles.deleteWrap}>
        <PlatformAccountDeleteRow />
      </View>
    </View>
  );
}

function PrefToggle({
  icon: Icon,
  label,
  hint,
  value,
  busy,
  first,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  hint: string;
  value: boolean;
  busy?: boolean;
  first?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={[styles.prefRow, !first && styles.prefBorder]}>
      <View style={[styles.iconWrap, value && styles.iconWrapOn]}>
        <Icon color={value ? '#EA4B14' : '#94A3B8'} size={16} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefHint}>{hint}</Text>
      </View>
      {busy ? (
        <ActivityIndicator color="#EA4B14" size="small" />
      ) : (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#E2E8F0', true: '#FDBA74' }}
          thumbColor={
            Platform.OS === 'android' ? (value ? '#EA4B14' : '#FFFFFF') : '#FFFFFF'
          }
          ios_backgroundColor="#E2E8F0"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prefBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F4EEE8',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconWrapOn: { backgroundColor: '#FFF1E8' },
  copy: { flex: 1, minWidth: 0 },
  prefLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: '#0F172A' },
  prefHint: { marginTop: 2, fontFamily: fonts.medium, fontSize: 12, color: '#94A3B8' },
  error: {
    marginHorizontal: 14,
    marginBottom: 10,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#B91C1C',
  },
  retry: { paddingVertical: 16, paddingHorizontal: 14 },
  retryText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#EA4B14' },
  deleteWrap: {
    borderTopWidth: 1,
    borderTopColor: '#F4EEE8',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
