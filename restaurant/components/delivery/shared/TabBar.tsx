import { usePathname, useRouter } from 'expo-router';
import { BarChart3, Home, Package, UserRound, Wallet } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/constants/typography';
import {
  DELIVERY_BOTTOM_TABS,
  DELIVERY_ROUTES,
  isDeliveryHomePath,
  type DeliveryTabKey,
} from '@/lib/delivery-partner/navigation';

const ORANGE = '#F97316';
const IDLE = '#9CA3AF';

const ICONS: Partial<Record<DeliveryTabKey, typeof Home>> = {
  home: Home,
  orders: Package,
  earnings: Wallet,
  analytics: BarChart3,
  profile: UserRound,
};

/** Floating bottom navbar, matching the customer app pill. */
export function DeliveryTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}
    >
      <View style={styles.bar}>
        {DELIVERY_BOTTOM_TABS.map((tab) => {
          const Icon = ICONS[tab.key] ?? Home;
          const isActive =
            pathname === tab.href ||
            (tab.href === DELIVERY_ROUTES.home &&
              isDeliveryHomePath(pathname)) ||
            (tab.href === DELIVERY_ROUTES.profile &&
              (pathname === DELIVERY_ROUTES.profile ||
                pathname.endsWith('/delivery/profile')));

          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (!isActive) router.replace(tab.href);
              }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View style={[styles.iconSlot, isActive && styles.iconSlotActive]}>
                <Icon
                  color={isActive ? ORANGE : IDLE}
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.9}
                  fill={isActive && tab.key === 'home' ? ORANGE : 'transparent'}
                />
              </View>
              <Text
                style={[styles.label, isActive && styles.labelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    zIndex: 50,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#F3E8DE',
    shadowColor: '#B4541A',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  iconSlot: {
    width: 46,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotActive: {
    backgroundColor: '#FFF1E6',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: IDLE,
    textAlign: 'center',
    marginLeft: 3,
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: ORANGE,
  },
  pressed: {
    opacity: 0.75,
  },
});
