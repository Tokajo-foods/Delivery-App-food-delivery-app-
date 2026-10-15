import { useSyncExternalStore } from 'react';

/** Why live location cannot run right now. `background` only matters during a trip. */
export type LocationLockReason = 'services' | 'permission' | 'background';

export type LivePlaceSnapshot = {
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  locating: boolean;
  servicesOn: boolean | null;
  lockReason: LocationLockReason | null;
};

const EMPTY: LivePlaceSnapshot = {
  label: null,
  latitude: null,
  longitude: null,
  locating: false,
  servicesOn: null,
  lockReason: null,
};

let snapshot: LivePlaceSnapshot = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function getLivePlaceSnapshot() {
  return snapshot;
}

export function patchLivePlace(partial: Partial<LivePlaceSnapshot>) {
  snapshot = { ...snapshot, ...partial };
  emit();
}

export function subscribeLivePlace(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLivePlaceSnapshot() {
  return useSyncExternalStore(subscribeLivePlace, getLivePlaceSnapshot, () => EMPTY);
}
