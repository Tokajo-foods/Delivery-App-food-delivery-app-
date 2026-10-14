import {
  BarChart3,
  Bike,
  ClipboardList,
  MessageSquareQuote,
  Tag,
  UtensilsCrossed,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import type { DashboardQuickActions } from '@/lib/dashboard/types';

type Props = {
  actions: DashboardQuickActions;
  onOrdersPress?: () => void;
  onMenuPress?: () => void;
  onPromosPress?: () => void;
  onAnalyticsPress?: () => void;
  onReviewsPress?: () => void;
  onPartnersPress?: () => void;
};

const ICON = '#EA4B14';
const WELL = '#FFF1E8';

const ACTIONS = [
  {
    key: 'orders',
    label: 'Orders',
    hint: (a: DashboardQuickActions) => {
      if (a.activeOrders <= 0) return undefined;
      return a.activeOrders > 99 ? '99+' : String(a.activeOrders);
    },
    icon: ClipboardList,
  },
  {
    key: 'menu',
    label: 'Menu',
    hint: (a: DashboardQuickActions) =>
      a.menuItems > 0 ? String(a.menuItems) : undefined,
    icon: UtensilsCrossed,
  },
  {
    key: 'promos',
    label: 'Offers',
    hint: (a: DashboardQuickActions) =>
      a.activePromos > 0 ? String(a.activePromos) : undefined,
    icon: Tag,
  },
  {
    key: 'analytics',
    label: 'Insights',
    hint: () => undefined,
    icon: BarChart3,
  },
  {
    key: 'reviews',
    label: 'Reviews',
    hint: (a: DashboardQuickActions) =>
      a.totalReviews > 0 ? String(a.totalReviews) : undefined,
    icon: MessageSquareQuote,
  },
  {
    key: 'partners',
    label: 'Riders',
    hint: () => undefined,
    icon: Bike,
  },
] as const;

export function QuickActionsGrid({
  actions,
  onOrdersPress,
  onMenuPress,
  onPromosPress,
  onAnalyticsPress,
  onReviewsPress,
  onPartnersPress,
}: Props) {
  const handlers: Record<string, (() => void) | undefined> = {
    orders: onOrdersPress,
    menu: onMenuPress,
    promos: onPromosPress,
    analytics: onAnalyticsPress,
    reviews: onReviewsPress,
    partners: onPartnersPress,
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Shortcuts</Text>
      <View style={styles.card}>
        {ACTIONS.map((item, index) => {
          const Icon = item.icon;
          const hint = item.hint(actions);
          const endCol = (index + 1) % 3 === 0;
          const lastRow = index >= 3;
          return (
            <Pressable
              key={item.key}
              onPress={handlers[item.key]}
              style={styles.cellPress}
            >
              <View
                style={[
                  styles.cell,
                  !endCol && styles.cellBorderRight,
                  !lastRow && styles.cellBorderBottom,
                ]}
              >
                <View style={styles.iconWrap}>
                  <Icon color={ICON} size={20} strokeWidth={1.8} />
                  {hint ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{hint}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.tileLabel}>{item.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    shadowColor: '#1F1300',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cellPress: {
    width: '33.333%',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  cellBorderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#D6D3D1',
  },
  cellBorderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D6D3D1',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WELL,
  },
  tileLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.text,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: fonts.bold,
  },
});
