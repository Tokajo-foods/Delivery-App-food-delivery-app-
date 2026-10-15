import axios from 'axios';

import { fetchLegacyDrivingLeg } from '@/lib/delivery-partner/google-road-legacy';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';

export type GoogleRoadLeg = {
  id?: string;
  distanceMeters: number;
  distanceKm: number;
  etaSeconds: number;
  etaMinutes: number;
  source: 'routes' | 'directions' | 'distance_matrix';
  provider: 'google';
  /** Encoded Google driving polyline, when the Routes API returns one. */
  polyline?: string;
};

export type RoadPoint = {
  latitude: number;
  longitude: number;
};

type RoutesResponse = {
  routes?: Array<{
    distanceMeters?: number;
    duration?: string;
    polyline?: { encodedPolyline?: string };
    legs?: Array<{
      distanceMeters?: number;
      duration?: string;
    }>;
  }>;
  error?: { message?: string; status?: string };
};

function validPoint(p?: RoadPoint | null): p is RoadPoint {
  return (
    !!p &&
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    !(p.latitude === 0 && p.longitude === 0)
  );
}

function parseDurationSeconds(raw?: string | null): number | null {
  if (!raw) return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(raw.trim());
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function toLeg(
  id: string | undefined,
  meters: number,
  seconds: number,
  source: GoogleRoadLeg['source']
): GoogleRoadLeg {
  const distanceKm = Math.round((meters / 1000) * 100) / 100;
  const etaSeconds = Math.max(1, Math.round(seconds));
  return {
    id,
    distanceMeters: Math.round(meters),
    distanceKm,
    etaSeconds,
    etaMinutes: Math.max(1, Math.ceil(etaSeconds / 60)),
    source,
    provider: 'google',
  };
}

function warnRoad(msg: string, extra?: Record<string, unknown>) {
  if (__DEV__) {
    console.warn(`[offer-road] ${msg}`, extra ?? '');
  }
}

/** New Routes API — same X-Goog-Api-Key pattern as Places (works with Expo key). */
function routesBody(
  origin: RoadPoint,
  destination: RoadPoint,
  withTraffic: boolean
) {
  return {
    origin: {
      location: {
        latLng: { latitude: origin.latitude, longitude: origin.longitude },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      },
    },
    travelMode: 'DRIVE',
    ...(withTraffic
      ? {
          routingPreference: 'TRAFFIC_AWARE',
          departureTime: new Date().toISOString(),
        }
      : {}),
    computeAlternativeRoutes: false,
    languageCode: 'en-IN',
    units: 'METRIC',
  };
}

async function postRoutes(
  origin: RoadPoint,
  destination: RoadPoint,
  withTraffic: boolean
): Promise<RoutesResponse> {
  const { data } = await axios.post<RoutesResponse>(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    routesBody(origin, destination, withTraffic),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask':
          'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration',
      },
      timeout: 12_000,
    }
  );
  return data;
}

function legFromRoutes(
  data: RoutesResponse,
  id: string | undefined
): GoogleRoadLeg | null {
  const route = data.routes?.[0];
  const meters = route?.distanceMeters ?? route?.legs?.[0]?.distanceMeters;
  const seconds =
    parseDurationSeconds(route?.duration) ??
    parseDurationSeconds(route?.legs?.[0]?.duration);
  if (meters == null || !Number.isFinite(meters) || meters <= 0) return null;
  const leg = toLeg(id, meters, seconds ?? 0, 'routes');
  const encoded = route?.polyline?.encodedPolyline;
  if (encoded) leg.polyline = encoded;
  return leg;
}

async function fetchRoutesLeg(
  origin: RoadPoint,
  destination: RoadPoint,
  id?: string
): Promise<GoogleRoadLeg | null> {
  try {
    const live = await postRoutes(origin, destination, true);
    const leg = legFromRoutes(live, id);
    if (leg) return leg;
    warnRoad('Routes API empty', { id, error: live.error?.message });
  } catch (err) {
    warnRoad('Routes traffic request failed', {
      id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
  const plain = await postRoutes(origin, destination, false);
  const leg = legFromRoutes(plain, id);
  if (!leg) warnRoad('Routes API empty', { id, error: plain.error?.message });
  return leg;
}

async function fetchOneRoadLeg(input: {
  id?: string;
  origin: RoadPoint;
  destination: RoadPoint;
}): Promise<GoogleRoadLeg | null> {
  if (!validPoint(input.origin) || !validPoint(input.destination)) return null;
  try {
    const viaRoutes = await fetchRoutesLeg(
      input.origin,
      input.destination,
      input.id
    );
    if (viaRoutes) return viaRoutes;
  } catch (err) {
    warnRoad('Routes API error', {
      id: input.id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
  return fetchLegacyDrivingLeg(input.origin, input.destination, input.id);
}

/**
 * Driving road km via Expo `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.
 * Prefers Routes API (header key, same as Places), then Directions, then Matrix.
 * Enable: Routes API, Directions API, Distance Matrix API on the key.
 */
export async function fetchGoogleRoadLegs(
  legs: Array<{
    id?: string;
    origin: RoadPoint;
    destination: RoadPoint;
  }>
): Promise<GoogleRoadLeg[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    warnRoad('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY missing');
    return [];
  }
  if (!legs.length) return [];
  const settled = await Promise.all(legs.map((leg) => fetchOneRoadLeg(leg)));
  return settled.filter((leg): leg is GoogleRoadLeg => Boolean(leg));
}

export function isGoogleMapsKeyConfigured(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY);
}
