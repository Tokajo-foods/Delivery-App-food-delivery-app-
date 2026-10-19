import { Pressable, Text, View } from 'react-native';

import { notificationStyles as styles } from '@/components/delivery/notifications/notifications-styles';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export type NotificationFilter = 'all' | 'unread';

export function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>
        {value}
      </Text>
    </View>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.filterHit}>
      <View
        style={[
          styles.filterPill,
          { backgroundColor: active ? authTheme.brand : 'transparent' },
        ]}
      >
        <Text
          style={{
            color: active ? '#FFFFFF' : authTheme.text,
            fontFamily: active ? fonts.bold : fonts.semiBold,
            fontSize: 13,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function NotificationsFilterBar({
  filter,
  unread,
  onChange,
}: {
  filter: NotificationFilter;
  unread: number;
  onChange: (next: NotificationFilter) => void;
}) {
  return (
    <View style={styles.filterRow}>
      <View style={styles.filterTrack}>
        <FilterPill label="All" active={filter === 'all'} onPress={() => onChange('all')} />
        <FilterPill
          label={`Unread${unread > 0 ? ` (${unread})` : ''}`}
          active={filter === 'unread'}
          onPress={() => onChange('unread')}
        />
      </View>
    </View>
  );
}
