type PendingRating = { deliveryId: string };

type Listener = (pending: PendingRating | null) => void;

let pending: PendingRating | null = null;
const skipped = new Set<string>();
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(pending);
}

export function offerTripRating(deliveryId: string) {
  const id = deliveryId.trim();
  if (!id || skipped.has(id)) return;
  pending = { deliveryId: id };
  emit();
}

export function dismissTripRating(deliveryId: string) {
  skipped.add(deliveryId);
  if (pending?.deliveryId === deliveryId) {
    pending = null;
    emit();
  }
}

export function subscribeTripRating(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}
