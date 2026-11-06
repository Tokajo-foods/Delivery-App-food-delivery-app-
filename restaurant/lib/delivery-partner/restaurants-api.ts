import {
  deliveryPartnerApi,
  isUnpaidTripStatus,
  normalizeDeliveryStatus,
  tripCreditsEarnings,
} from '@/lib/delivery-partner/api';
import type {
  RiderRestaurantStat,
  RiderRestaurantsResult,
} from '@/lib/delivery-partner/restaurants-types';
import type { PartnerDelivery } from '@/lib/delivery-partner/types';

export const RIDER_RESTAURANTS_WINDOW_DAYS = 30;
const PAGE_LIMIT = 100;
const MAX_PAGES = 5;
const NAME_LOOKUP_CONCURRENCY = 4;

type RestaurantContact = { name?: string };

/** Restaurant names rarely change; keep per session to avoid repeat order-context calls. */
const contactCache = new Map<string, RestaurantContact>();

function tripTime(d: PartnerDelivery): string | undefined {
  return (
    d.deliveredAt ??
    d.returnedAt ??
    d.failedAt ??
    d.pickedUpAt ??
    d.acceptedAt ??
    d.assignedAt ??
    d.createdAt
  );
}

function timeValue(iso?: string) {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

async function fetchHistory(dateFrom: string) {
  const trips: PartnerDelivery[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && page <= MAX_PAGES) {
    const res = await deliveryPartnerApi.getDeliveries({
      page,
      limit: PAGE_LIMIT,
      dateFrom,
    });
    trips.push(...res.deliveries);
    hasNext = res.hasNext;
    page += 1;
  }
  return { trips, partial: hasNext };
}

function aggregate(trips: PartnerDelivery[]): RiderRestaurantStat[] {
  const byId = new Map<string, RiderRestaurantStat>();
  for (const trip of trips) {
    const restaurantId = trip.restaurantId?.trim();
    if (!restaurantId) continue;
    const status = normalizeDeliveryStatus(trip.status);
    const at = tripTime(trip);
    let row = byId.get(restaurantId);
    if (!row) {
      row = {
        restaurantId,
        deliveredTrips: 0,
        returnedTrips: 0,
        unpaidTrips: 0,
        earned: 0,
        latestDeliveryId: trip.id,
        lastTripAt: at,
        lat: trip.restaurantAddress?.lat,
        lng: trip.restaurantAddress?.lng,
      };
      byId.set(restaurantId, row);
    } else if (timeValue(at) > timeValue(row.lastTripAt)) {
      row.lastTripAt = at;
      row.latestDeliveryId = trip.id;
      row.lat = trip.restaurantAddress?.lat ?? row.lat;
      row.lng = trip.restaurantAddress?.lng ?? row.lng;
    }
    if (status === 'delivered') row.deliveredTrips += 1;
    else if (status === 'returned') row.returnedTrips += 1;
    else if (isUnpaidTripStatus(status)) row.unpaidTrips += 1;
    if (tripCreditsEarnings(status) && trip.earning != null && Number.isFinite(trip.earning)) {
      row.earned += trip.earning;
    }
  }
  return [...byId.values()].sort(
    (a, b) =>
      b.deliveredTrips + b.returnedTrips - (a.deliveredTrips + a.returnedTrips) ||
      timeValue(b.lastTripAt) - timeValue(a.lastTripAt)
  );
}

async function resolveContacts(rows: RiderRestaurantStat[]) {
  const pending = rows.filter((row) => !contactCache.has(row.restaurantId));
  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const row = pending[cursor++]!;
      try {
        const ctx = await deliveryPartnerApi.getDeliveryOrderContext(row.latestDeliveryId);
        const name = ctx.restaurantName?.trim();
        if (name) {
          contactCache.set(row.restaurantId, { name });
        }
      } catch {
        // Name stays undefined; the card shows "Name unavailable" and retries next refresh.
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(NAME_LOOKUP_CONCURRENCY, pending.length) }, worker)
  );
  for (const row of rows) {
    const contact = contactCache.get(row.restaurantId);
    row.name = contact?.name;
  }
}

export const riderRestaurantsApi = {
  /** Restaurants from the rider's own trips in the last `windowDays`. */
  getRestaurants: async (
    windowDays = RIDER_RESTAURANTS_WINDOW_DAYS
  ): Promise<RiderRestaurantsResult> => {
    const from = new Date(Date.now() - windowDays * 86_400_000);
    const { trips, partial } = await fetchHistory(from.toISOString());
    const restaurants = aggregate(trips);
    await resolveContacts(restaurants);
    return {
      windowDays,
      restaurants,
      totalPaidTrips: restaurants.reduce(
        (sum, r) => sum + r.deliveredTrips + r.returnedTrips,
        0
      ),
      totalEarned: restaurants.reduce((sum, r) => sum + r.earned, 0),
      partial,
    };
  },
};

export function formatLastTrip(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
