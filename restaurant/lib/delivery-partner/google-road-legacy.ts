import axios from 'axios';

import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';

import type { GoogleRoadLeg, RoadPoint } from '@/lib/delivery-partner/google-road-distance';

type DirectionsResponse = {
  status?: string;
  error_message?: string;
  routes?: Array<{
    legs?: Array<{
      distance?: { value?: number };
      duration?: { value?: number };
      duration_in_traffic?: { value?: number };
    }>;
  }>;
};

type MatrixResponse = {
  status?: string;
  error_message?: string;
  rows?: Array<{
    elements?: Array<{
      status?: string;
      distance?: { value?: number };
      duration?: { value?: number };
      duration_in_traffic?: { value?: number };
    }>;
  }>;
};

function warnRoad(msg: string, extra?: Record<string, unknown>) {
  if (__DEV__) console.warn(`[offer-road] ${msg}`, extra ?? '');
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

async function fetchDirectionsLeg(
  origin: RoadPoint,
  destination: RoadPoint,
  id?: string
): Promise<GoogleRoadLeg | null> {
  const { data } = await axios.get<DirectionsResponse>(
    'https://maps.googleapis.com/maps/api/directions/json',
    {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: 'driving',
        departure_time: 'now',
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 12_000,
    }
  );
  const leg = data.routes?.[0]?.legs?.[0];
  const meters = leg?.distance?.value;
  const seconds = leg?.duration_in_traffic?.value ?? leg?.duration?.value;
  if (data.status !== 'OK' || meters == null || seconds == null) {
    warnRoad('Directions failed', {
      id,
      status: data.status,
      error: data.error_message,
    });
    return null;
  }
  return toLeg(id, meters, seconds, 'directions');
}

async function fetchMatrixLeg(
  origin: RoadPoint,
  destination: RoadPoint,
  id?: string
): Promise<GoogleRoadLeg | null> {
  const { data } = await axios.get<MatrixResponse>(
    'https://maps.googleapis.com/maps/api/distancematrix/json',
    {
      params: {
        origins: `${origin.latitude},${origin.longitude}`,
        destinations: `${destination.latitude},${destination.longitude}`,
        mode: 'driving',
        departure_time: 'now',
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 12_000,
    }
  );
  const el = data.rows?.[0]?.elements?.[0];
  const meters = el?.distance?.value;
  const seconds = el?.duration_in_traffic?.value ?? el?.duration?.value;
  if (data.status !== 'OK' || el?.status !== 'OK' || meters == null || seconds == null) {
    warnRoad('Distance Matrix failed', {
      id,
      status: data.status,
      element: el?.status,
      error: data.error_message,
    });
    return null;
  }
  return toLeg(id, meters, seconds, 'distance_matrix');
}

/** Legacy Directions, then Distance Matrix. Used when Routes API is blocked. */
export async function fetchLegacyDrivingLeg(
  origin: RoadPoint,
  destination: RoadPoint,
  id?: string
): Promise<GoogleRoadLeg | null> {
  try {
    const viaDirections = await fetchDirectionsLeg(origin, destination, id);
    if (viaDirections) return viaDirections;
  } catch (err) {
    warnRoad('Directions error', {
      id,
      message: err instanceof Error ? err.message : String(err),
    });
  }
  try {
    return await fetchMatrixLeg(origin, destination, id);
  } catch (err) {
    warnRoad('Matrix error', {
      id,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
