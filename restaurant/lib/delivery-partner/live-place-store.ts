import { useSyncExternalStore } from 'react';

export type LivePlaceSnapshot = {
  label: string | null;
  locating: boolean;
  servicesOn: boolean | null;
};

const EMPTY: LivePlaceSnapshot = {
  label: null,
  locating: false,
  servicesOn: null,
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
