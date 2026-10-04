/** When the OS may keep sending GPS after the app leaves the foreground. */
const ACTIVE_TRIP = new Set([
  'picked_up',
  'out_for_delivery',
  'at_customer',
  'arrived_at_customer',
  'returning_to_restaurant',
]);

export const BG_MOVING_INTERVAL_MS = 4_000;
export const BG_STATIONARY_INTERVAL_MS = 12_000;
export const BG_STATIONARY_METERS = 8;
export const BG_POOR_ACCURACY_M = 80;
export const BG_MAX_QUEUE = 8;
/** Matches location-service STALE_MS. Older points are dropped, not restamped. */
export const BG_MAX_AGE_MS = 120_000;

export type QueuedFix = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
  /** Device capture time. Never replace this with the flush time. */
  timestamp: number;
};

export function isBackgroundTripStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return ACTIVE_TRIP.has(status.trim().toLowerCase());
}

export function haversineMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isUsableAccuracy(accuracy: number | null | undefined): boolean {
  if (accuracy == null || !Number.isFinite(accuracy)) return true;
  return accuracy <= BG_POOR_ACCURACY_M;
}

export function shouldSampleFix(
  previous: { latitude: number; longitude: number; at: number } | null,
  fix: QueuedFix,
): boolean {
  if (!previous) return true;
  const elapsed = fix.timestamp - previous.at;
  if (elapsed < 0) return true;
  const moved = haversineMeters(previous, fix);
  if (moved >= BG_STATIONARY_METERS) return elapsed >= BG_MOVING_INTERVAL_MS;
  return elapsed >= BG_STATIONARY_INTERVAL_MS;
}

export function pushFix(queue: readonly QueuedFix[], fix: QueuedFix): QueuedFix[] {
  return [...queue, fix].slice(-BG_MAX_QUEUE);
}

/** Drops fixes that are too old to send. Does not change the timestamp of the rest. */
export function dropExpired(queue: readonly QueuedFix[], now: number): QueuedFix[] {
  return queue.filter((fix) => now - fix.timestamp <= BG_MAX_AGE_MS);
}

export function nextDelayMs(attempt: number, random: () => number = Math.random): number {
  const step = Math.max(0, attempt);
  const base = Math.min(30_000, 1_000 * 2 ** Math.min(step, 5));
  return base + Math.floor(random() * 400);
}
