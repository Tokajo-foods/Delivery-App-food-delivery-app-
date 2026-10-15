import { useEffect, useRef, useState } from 'react';

import {
  fetchGoogleRoadLegs,
  type GoogleRoadLeg,
} from '@/lib/delivery-partner/google-road-distance';

type Point = { latitude: number; longitude: number };

function keyFor(point: Point | null, places: number) {
  if (!point) return '';
  return `${point.latitude.toFixed(places)},${point.longitude.toFixed(places)}`;
}

/**
 * Driving time and distance from Google Routes (same numbers as the Google Maps app).
 * Refreshes when the rider moves about 100 m or the destination changes.
 */
export type GoogleDriveRouteState = {
  leg: GoogleRoadLeg | null;
  /** loading until Google answers; unavailable means do not show a straight-line guess. */
  status: 'loading' | 'ready' | 'unavailable';
};

export function useGoogleDriveRoute(
  origin: Point | null,
  destination: Point | null
): GoogleDriveRouteState {
  const [leg, setLeg] = useState<GoogleRoadLeg | null>(null);
  const [status, setStatus] = useState<GoogleDriveRouteState['status']>('loading');
  const originRef = useRef(origin);
  const destRef = useRef(destination);
  originRef.current = origin;
  destRef.current = destination;
  const originKey = keyFor(origin, 3);
  const destKey = keyFor(destination, 4);

  useEffect(() => {
    const from = originRef.current;
    const to = destRef.current;
    if (!from || !to || !originKey || !destKey) {
      setLeg(null);
      setStatus('unavailable');
      return;
    }
    let cancel = false;
    setStatus('loading');
    void fetchGoogleRoadLegs([{ origin: from, destination: to }]).then((rows) => {
      if (cancel) return;
      const next = rows[0] ?? null;
      setLeg(next);
      setStatus(next ? 'ready' : 'unavailable');
    });
    return () => {
      cancel = true;
    };
  }, [originKey, destKey]);

  return { leg, status };
}
