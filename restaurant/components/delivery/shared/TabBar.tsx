import { usePathname, useRouter } from 'expo-router';
import { BarChart3, Home, Package, Wallet } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  DELIVERY_BOTTOM_TABS,
  DELIVERY_ROUTES,
  isDeliveryHomePath,
  type DeliveryTabKey,
} from '@/lib/delivery-partner/navigation';

const ICONS: Partial<Record<DeliveryTabKey, typeof Home>> = {
  home: Home,
  orders: Package,
  earnings: Wallet,
  analytics: BarChart3,
};

/** Compact 4-tab bottom navbar for delivery partner. */
export function DeliveryTabBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View
      style={[
        styles.wrap,
        { bottom: Math.max(insets.bottom, 16) },
      ]}
    >
      <View style={styles.bar}>
        {DELIVERY_BOTTOM_TABS.map((tab) => {
          const Icon = ICONS[tab.key] ?? Home;
          const isActive =
            pathname === tab.href ||
            (tab.href === DELIVERY_ROUTES.home &&
              isDeliveryHomePath(pathname));

          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (!isActive) router.replace(tab.href);
              }}
              style={({ pressed }) => [
                styles.tab,
                isActive && styles.tabActive,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View
                style={[styles.iconWrap, isActive && styles.iconWrapActive]}
              >
                <Icon
                  color={isActive ? '#FFFFFF' : '#EA4B14'}
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.9}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>
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
    left: 20,
    right: 20,
    zIndex: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE4D6',
    borderRadius: 28,
    paddingVertical: 8,
    shadowColor: '#C2410C',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    gap: 4,
  },
  tabActive: {},
  iconWrap: {
    width: 44,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#EA4B14',
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: '#C2410C',
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: '#EA4B14',
  },
  pressed: {
    opacity: 0.75,
  },
});
