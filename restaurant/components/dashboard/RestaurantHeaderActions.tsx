import { usePathname, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  LIVE_INTERVALS,
  liveRefetchInterval,
  useAppIsActive,
} from '@/lib/live-query';
import { useUnreadNotificationCount } from '@/lib/notification/hooks';
import { useAuthStore } from '@/store/auth-store';

/** Shared notification bell for restaurant screens other than Home. */
export function RestaurantHeaderActions({
  hideProfile: _hideProfile,
}: {
  hideProfile?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const isActive = useAppIsActive();
  const unreadQuery = useUnreadNotificationCount({
    enabled: Boolean(token),
    refetchInterval: liveRefetchInterval(LIVE_INTERVALS.notifications, isActive),
  });

  const unread = Math.max(0, unreadQuery.data ?? 0);
  const notifActive = pathname === '/notifications';

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          if (!notifActive) router.push('/notifications');
        }}
        style={[styles.btn, notifActive && styles.btnActive]}
        accessibilityRole="button"
        accessibilityLabel={
          unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
        }
        hitSlop={6}
      >
        <Bell color="#EA4B14" size={18} strokeWidth={2.2} />
        {unread > 0 ? <View style={styles.dot} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E7DE',
  },
  btnActive: {
    backgroundColor: '#FFF1E8',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EA4B14',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
