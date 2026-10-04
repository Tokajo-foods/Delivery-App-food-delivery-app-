import {
  pairKeyFor,
  type CallRole,
  type CallRow,
  type OrderMasks,
  type ViewerKind,
} from '@/lib/call/types';

const LABEL: Record<CallRole, string> = {
  customer: 'Customer',
  restaurant: 'Restaurant',
  rider: 'Rider',
};

const ORDER: CallRole[] = ['customer', 'restaurant', 'rider'];

export function buildCallRows(data: OrderMasks | undefined, viewer: ViewerKind): CallRow[] {
  if (!data) return [];
  const byRole = new Map<CallRole, CallRow>();
  for (const mask of data.masks ?? []) {
    if (!pairKeyFor(viewer, mask.role) || !mask.virtualNumber) continue;
    byRole.set(mask.role, {
      role: mask.role,
      label: LABEL[mask.role],
      virtualNumber: mask.virtualNumber,
      internetAvailable: false,
    });
  }
  for (const choice of data.internet ?? []) {
    if (!pairKeyFor(viewer, choice.role)) continue;
    const prev = byRole.get(choice.role);
    byRole.set(choice.role, {
      role: choice.role,
      label: LABEL[choice.role],
      virtualNumber: prev?.virtualNumber ?? null,
      internetAvailable: choice.available === true,
    });
  }
  return ORDER.flatMap((role) => {
    const row = byRole.get(role);
    return row ? [row] : [];
  });
}
