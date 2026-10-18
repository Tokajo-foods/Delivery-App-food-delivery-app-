import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { DashboardTabBar } from '@/components/dashboard/DashboardTabBar';
import { EarningsManager } from '@/components/earnings/EarningsManager';
import { useDashboardStats } from '@/lib/dashboard/hooks';

export default function EarningsScreen() {
  const router = useRouter();
  const { data } = useDashboardStats();

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F6F7' }}>
      <View style={{ flex: 1 }}>
        <EarningsManager />
      </View>
      <DashboardTabBar
        active="stats"
        centerBadge={data?.quickActions.activeOrders}
        onNavigate={(href) => router.replace(href)}
      />
    </View>
  );
}
