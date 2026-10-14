import { usePathname, useRouter } from 'expo-router';
import {
  ClipboardList,
  Home,
  Settings,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/constants/typography';

const ORANGE = '#F97316';
const IDLE = '#9CA3AF';

export type DashboardTab = 'stats' | 'orders' | 'menu' | 'admin';

type TabItem = {
  key: DashboardTab;
  label: string;
  icon: typeof Home;
  href: '/dashboard' | '/orders' | '/menu' | '/admin';
};

const tabs: TabItem[] = [
  { key: 'stats', label: 'Home', icon: Home, href: '/dashboard' },
  { key: 'orders', label: 'Orders', icon: ClipboardList, href: '/orders' },
  { key: 'menu', label: 'Menu', icon: UtensilsCrossed, href: '/menu' },
  { key: 'admin', label: 'Admin', icon: Settings, href: '/admin' },
];

type Props = {
  /** @deprecated Preferred: active tab is inferred from the current route. */
  active?: DashboardTab;
  onNavigate?: (href: TabItem['href']) => void;
  onCenterPress?: () => void;
  centerBadge?: number;
};

function pathMatchesTab(pathname: string, tab: TabItem) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (tab.href === '/dashboard') {
    return path === '/dashboard' || path === '';
  }
  if (tab.href === '/orders') {
    return path === '/orders' || path.startsWith('/order/');
  }
  if (tab.href === '/menu') {
    return path === '/menu' || path.startsWith('/menu/');
  }
  if (tab.href === '/admin') {
    return (
      path === '/admin' ||
      path === '/settings' ||
      path.startsWith('/settings/') ||
      path === '/onboarding' ||
      path === '/chain' ||
      path === '/staff' ||
      path.startsWith('/staff/') ||
      path === '/account'
    );
  }
  return path === tab.href;
}

/** Floating pill navbar, matching the delivery partner tab bar. */
export function DashboardTabBar({
  active,
  onNavigate,
  centerBadge = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const glow = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.95,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.45,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const go = (href: TabItem['href']) => {
    if (onNavigate) onNavigate(href);
    else router.replace(href);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}
    >
      <View>
        <Animated.View
          pointerEvents="none"
          style={[styles.glow, { opacity: glow }]}
        />
        <View style={styles.bar}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathMatchesTab(pathname, tab) ||
              (!pathname && active === tab.key);
            const showBadge = tab.key === 'orders' && centerBadge > 0;

            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  if (!pathMatchesTab(pathname, tab)) {
                    go(tab.href);
                  }
                }}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tab.label}
              >
                <View
                  style={[styles.iconSlot, isActive && styles.iconSlotActive]}
                >
                  <Icon
                    color={isActive ? ORANGE : IDLE}
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.9}
                    fill={
                      isActive && tab.key === 'stats' ? ORANGE : 'transparent'
                    }
                  />
                  {showBadge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {centerBadge > 9 ? '9+' : String(centerBadge)}
                      </Text>
                    </View>
                  ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 0,
    zIndex: 50,
  },
  glow: {
    position: 'absolute',
    left: -1,
    right: -1,
    top: -1,
    bottom: -1,
    borderRadius: 33,
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F6E4D6',
    shadowColor: '#F97316',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  iconSlot: {
    width: 40,
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
  },
  labelActive: {
    fontFamily: fonts.bold,
    color: ORANGE,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bold,
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.75,
  },
});
