import { useRouter } from 'expo-router';
import { Bell, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from 'react-native';

import { notificationStyles as styles } from '@/components/delivery/notifications/notifications-styles';
import { authTheme } from '@/constants/auth-theme';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from '@/lib/notification/preferences';
import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from '@/lib/notification/types';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_META,
} from '@/lib/notification/types';

export function InAppAlertPrefsCard() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadNotificationPreferences().then((loaded) => {
      if (!mounted) return;
      setPrefs(loaded);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = async (key: NotificationPreferenceKey) => {
    const previous = prefs;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await saveNotificationPreferences(next);
    } catch {
      setPrefs(previous);
      Alert.alert('Could not save', 'Preference was not saved. Try again.');
    }
  };

  return (
    <View style={styles.prefsCard}>
      <View style={styles.prefsHeader}>
        <Bell color={authTheme.brand} size={16} />
        <Text style={styles.prefsTitle}>In-app pop-ups</Text>
      </View>
      <Text style={styles.prefsSubtitle}>
        Choose which alerts pop up while the app is open on this phone. Updates
        still land in this inbox while Push is on in Profile.
      </Text>

      {!ready ? (
        <ActivityIndicator color={authTheme.brand} style={{ marginTop: 12 }} />
      ) : (
        NOTIFICATION_PREFERENCE_META.map((item, index) => {
          const enabled = prefs[item.key];
          return (
            <View
              key={item.key}
              style={[
                styles.prefRow,
                index < NOTIFICATION_PREFERENCE_META.length - 1 && styles.prefRowBorder,
              ]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.prefLabel}>{item.label}</Text>
                <Text style={styles.prefDesc}>{item.description}</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={() => void toggle(item.key)}
                trackColor={{ false: '#CBD5E1', true: 'rgba(122, 14, 34, 0.35)' }}
                thumbColor={enabled ? authTheme.brand : '#F8FAFC'}
                ios_backgroundColor="#CBD5E1"
              />
            </View>
          );
        })
      )}

      <Pressable
        style={styles.prefsLink}
        onPress={() => router.push(DELIVERY_ROUTES.profile as never)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.prefLabel}>Push, SMS & email</Text>
          <Text style={styles.prefDesc}>
            Manage account channels and phones in Profile
          </Text>
        </View>
        <ChevronRight color={authTheme.textDim} size={18} />
      </Pressable>
    </View>
  );
}
