import { api } from '@/lib/api';
import { restaurantAnalyticsApi } from '@/lib/analytics/api';
import type { AnalyticsOverview, RevenueAnalytics } from '@/lib/analytics/types';
import { computeTrendPercent, trendInsight } from '@/lib/dashboard/format';
import type { DashboardData, OwnerOrder } from '@/lib/dashboard/types';
import { restaurantOrderApi, getCachedRestaurantOrders } from '@/lib/order/owner-api';
import { restaurantOwnerApi } from '@/lib/restaurant/api';
import { restaurantEarningsApi } from '@/lib/restaurant/earnings-api';
import type { RestaurantOwnerRestaurant } from '@/lib/restaurant/types';

const RESTAURANT_BASE = '/api/v1/restaurant-service/restaurants';

type Envelope<T> = {
  success?: boolean;
  data?: T;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function numberField(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

async function getMenuItemCount(restaurantId: string): Promise<number> {
  try {
    const res = await api.get<Envelope<unknown>>(
      `${RESTAURANT_BASE}/${restaurantId}/items`
    );
    const raw = res.data?.data ?? res.data;
    return Array.isArray(raw) ? raw.length : 0;
  } catch {
    return 0;
  }
}

async function getActivePromoCount(restaurantId: string): Promise<number> {
  try {
    const res = await api.get<Envelope<unknown>>(
      `${RESTAURANT_BASE}/${restaurantId}/offers`
    );
    const raw = res.data?.data ?? res.data;
    if (!Array.isArray(raw)) return 0;
    return raw.filter((row) => {
      const offer = asRecord(row);
      const active = offer.isActive ?? offer.active ?? offer.status;
      if (typeof active === 'boolean') return active;
      if (typeof active === 'string') {
        return active.toLowerCase() === 'active' || active.toLowerCase() === 'live';
      }
      return true;
    }).length;
  } catch {
    return 0;
  }
}

/** Safe UI shell while stats load or analytics is temporarily unavailable. */
export function dashboardShellFromRestaurant(
  restaurant: Pick<RestaurantOwnerRestaurant, 'id' | 'name' | 'logoUrl' | 'address' | 'city'>,
): DashboardData {
  const insight = trendInsight(0);
  const address = restaurant.address;
  const city =
    String(address?.city ?? restaurant.city ?? '').trim() || undefined;
  return {
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    city,
    logoUrl: restaurant.logoUrl,
    insight: {
      title: insight.title,
      subtitle: insight.subtitle,
      trendPercent: 0,
    },
    metrics: {
      grossRevenue: null,
      revenueTrendPercent: null,
      yesterdayRevenue: null,
      revenueBars: [],
      revenueSeries: [],
      totalOrders: null,
      rating: null,
      ratingMax: 5,
      totalRatings: null,
      avgDeliveryMinutes: null,
      isOnline: false,
    },
    quickActions: {
      activeOrders: 0,
      menuItems: 0,
      activePromos: 0,
      totalReviews: 0,
    },
    pendingOrders: [],
  };
}

async function loadAnalyticsOverview(
  restaurantId: string,
): Promise<AnalyticsOverview | null> {
  try {
    return await restaurantAnalyticsApi.getOverview(restaurantId);
  } catch {
    return null;
  }
}

function todayNetFromWeekRevenue(revenue: RevenueAnalytics | null): number | null {
  const points = revenue?.points ?? [];
  if (!points.length) return null;
  const last = points[points.length - 1];
  const value = last?.revenue;
  return value != null && Number.isFinite(value) ? value : null;
}

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardData | null> => {
    const restaurant = await restaurantOwnerApi.getMyRestaurant();
    if (!restaurant?.id) return null;

    const record = restaurant as Record<string, unknown>;

    // Prefer kitchen-board cache when live sync already loaded it (avoids
    // a duplicate /orders call on every dashboard poll).
    const [
      analytics,
      revenue,
      earningsSummary,
      menuItems,
      activePromos,
    ] = await Promise.all([
      loadAnalyticsOverview(restaurant.id),
      restaurantAnalyticsApi.getRevenue(restaurant.id, 'week').catch(() => null),
      restaurantEarningsApi.getSummary(restaurant.id).catch(() => null),
      getMenuItemCount(restaurant.id),
      getActivePromoCount(restaurant.id),
    ]);

    const cachedOrders = getCachedRestaurantOrders(restaurant.id);
    const pendingOrders = cachedOrders
      ? cachedOrders.filter((order) =>
          ['pending', 'placed', 'pending_payment'].includes(order.status)
        )
      : await restaurantOrderApi
          .getPendingOrders(restaurant.id)
          .catch(() => [] as OwnerOrder[]);

    const currentOrderCount = numberField(record, [
      'currentOrderCount',
      'activeOrders',
      'liveOrders',
    ]);

    // Today's net earnings: order analytics overview, else wallet (IST), else week chart today bar.
    const grossRevenue =
      (analytics != null && Number.isFinite(analytics.revenueToday)
        ? analytics.revenueToday
        : null) ??
      (earningsSummary != null &&
      Number.isFinite(earningsSummary.periods.today?.netEarnings)
        ? earningsSummary.periods.today.netEarnings
        : null) ??
      todayNetFromWeekRevenue(revenue);

    const avgDeliveryMinutes = null;

    const totalOrders =
      (analytics != null && Number.isFinite(analytics.ordersToday)
        ? analytics.ordersToday
        : null) ??
      (earningsSummary != null &&
      Number.isFinite(earningsSummary.periods.today?.deliveredOrders)
        ? earningsSummary.periods.today.deliveredOrders
        : earningsSummary != null &&
            Number.isFinite(earningsSummary.periods.today?.orders)
          ? earningsSummary.periods.today.orders
          : null);
    const rating =
      analytics?.avgRating && analytics.avgRating > 0
        ? analytics.avgRating
        : null;
    const totalRatings =
      analytics?.totalRatings && analytics.totalRatings > 0
        ? analytics.totalRatings
        : null;

    const series = (revenue?.points ?? [])
      .filter((point) => Number.isFinite(point.revenue) && point.revenue >= 0)
      .slice(-7)
      .map((point) => ({
        label: point.label,
        value: point.revenue,
      }));

    const revenueBars = series.map((point) => point.value);
    const lastBar = revenueBars[revenueBars.length - 1] ?? 0;
    const prevBar = revenueBars[revenueBars.length - 2] ?? 0;
    const trendPercent = computeTrendPercent(lastBar, prevBar);
    const insightCopy = trendInsight(trendPercent);
    const activeOrders = Math.max(currentOrderCount, pendingOrders.length);

    const address = asRecord(record.address);
    const city =
      String(address.city ?? record.city ?? '').trim() || undefined;

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      city,
      logoUrl: restaurant.logoUrl,
      insight: {
        title: insightCopy.title,
        subtitle: insightCopy.subtitle,
        trendPercent,
      },
      metrics: {
        grossRevenue,
        revenueTrendPercent: revenueBars.length >= 2 ? trendPercent : null,
        yesterdayRevenue: null,
        revenueBars,
        revenueSeries: series,
        totalOrders,
        rating,
        ratingMax: 5,
        totalRatings,
        avgDeliveryMinutes,
        isOnline: record.isOnline === true,
      },
      quickActions: {
        activeOrders,
        menuItems,
        activePromos,
        totalReviews: totalRatings ?? 0,
      },
      pendingOrders: pendingOrders.slice(0, 6),
    };
  },
};
