/**
 * Restaurants the rider has picked up from, aggregated client-side from
 * GET /partners/me/deliveries (past trips) + per-trip order-context for names.
 */

export type RiderRestaurantStat = {
  restaurantId: string;
  /** From GET /partners/me/deliveries/:id/order-context; undefined when lookup failed. */
  name?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  deliveredTrips: number;
  returnedTrips: number;
  /** cancelled / failed / reassigned — no trip pay. */
  unpaidTrips: number;
  /** Sum of trip pay on delivered + returned trips. */
  earned: number;
  lastTripAt?: string;
  latestDeliveryId: string;
};

export type RiderRestaurantsResult = {
  windowDays: number;
  restaurants: RiderRestaurantStat[];
  totalPaidTrips: number;
  totalEarned: number;
  /** True when history had more trips than the client scans. */
  partial: boolean;
};
