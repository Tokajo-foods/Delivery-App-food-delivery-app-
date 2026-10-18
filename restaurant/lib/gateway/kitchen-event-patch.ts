import type { QueryClient } from '@tanstack/react-query';

import type { OwnerOrder } from '@/lib/dashboard/types';
import { restaurantOrderKeys, syncDashboardFromOrders } from '@/lib/order/hooks';

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

export function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function fulfillmentFromDeliveryType(value?: string): OwnerOrder['fulfillmentTone'] {
  const raw = (value ?? '').toLowerCase();
  if (raw.includes('pickup') || raw.includes('takeaway')) return 'pickup';
  if (raw.includes('dine') || raw.includes('table')) return 'table';
  return 'delivery';
}

function fulfillmentLabel(tone: OwnerOrder['fulfillmentTone']): string {
  if (tone === 'pickup') return 'Pickup';
  if (tone === 'table') return 'Dine-in';
  return 'Delivery';
}

export function mapIncomingOrder(
  record: Record<string, unknown>,
  fallbackStatus?: string
): Partial<OwnerOrder> & { id?: string } {
  const id = pickString(record, ['orderId', 'id', '_id']);
  const status =
    pickString(record, ['status', 'orderStatus']) ?? fallbackStatus;
  const deliveryType = pickString(record, ['deliveryType', 'fulfillment']);
  const totalRaw = record.grandTotal ?? record.total;
  const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw);
  const patch: Partial<OwnerOrder> & { id?: string } = {
    ...(id ? { id } : {}),
    ...(pickString(record, ['orderNumber'])
      ? { orderNumber: pickString(record, ['orderNumber']) }
      : {}),
    ...(status ? { status } : {}),
    ...(pickString(record, ['paymentMethod'])
      ? { paymentMethod: pickString(record, ['paymentMethod']) }
      : {}),
    ...(Number.isFinite(total) ? { total } : {}),
  };
  if (deliveryType) {
    const tone = fulfillmentFromDeliveryType(deliveryType);
    patch.fulfillmentTone = tone;
    patch.fulfillmentLabel = fulfillmentLabel(tone);
  }
  return patch;
}

export function patchList(
  queryClient: QueryClient,
  restaurantId: string,
  orderId: string,
  patch: Partial<OwnerOrder>,
  insert = true
) {
  const listKey = restaurantOrderKeys.list(restaurantId);
  queryClient.setQueryData(listKey, (current: unknown) => {
    if (!Array.isArray(current)) {
      if (insert && patch.id && patch.status) return [patch as OwnerOrder];
      return current;
    }
    const rows = current as OwnerOrder[];
    const index = rows.findIndex((row) => row.id === orderId);
    if (index < 0) {
      if (!insert || !patch.status) return rows;
      const next: OwnerOrder = {
        id: orderId,
        orderNumber: patch.orderNumber ?? orderId.slice(-6).toUpperCase(),
        status: patch.status,
        items: [],
        fulfillmentLabel: patch.fulfillmentLabel ?? 'Delivery',
        fulfillmentTone: patch.fulfillmentTone ?? 'delivery',
        ...patch,
      };
      return [next, ...rows];
    }
    const merged = { ...rows[index], ...patch, id: orderId };
    const copy = [...rows];
    copy[index] = merged;
    return copy;
  });

  const list = queryClient.getQueryData(listKey);
  if (Array.isArray(list)) {
    syncDashboardFromOrders(queryClient, list);
  }

  queryClient.setQueryData(
    restaurantOrderKeys.detail(restaurantId, orderId),
    (current: unknown) => {
      if (!current || typeof current !== 'object') return current;
      return { ...(current as OwnerOrder), ...patch, id: orderId };
    }
  );
}

