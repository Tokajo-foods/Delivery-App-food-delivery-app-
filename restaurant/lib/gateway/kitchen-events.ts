import type { QueryClient } from '@tanstack/react-query';

import type { OwnerOrder } from '@/lib/dashboard/types';
import { notificationKeys } from '@/lib/notification/hooks';
import { restaurantOrderKeys } from '@/lib/order/hooks';
import type { KitchenKdsBoard } from '@/lib/order/owner-api';
import { earningsKeys } from '@/lib/restaurant/earnings-keys';

import {
  asRecord,
  mapIncomingOrder,
  patchList,
  pickString,
} from '@/lib/gateway/kitchen-event-patch';
import type { KitchenInboundEvent } from '@/lib/gateway/kitchen-event-types';
import { invalidateKitchenPricing } from '@/lib/pricing/pricing-sync';

export type { KitchenInboundEvent };

/** Wallet credit lands shortly after the status sync, so refetch once more after a beat. */
function refreshEarnings(queryClient: QueryClient, restaurantId: string) {
  const invalidate = () =>
    void queryClient.invalidateQueries({
      queryKey: earningsKeys.restaurant(restaurantId),
      refetchType: 'active',
    });
  invalidate();
  setTimeout(invalidate, 3_000);
}

/** Apply a kitchen socket payload to the live board + ticket cache. */
export function applyKitchenSocketEvent(
  queryClient: QueryClient,
  restaurantId: string,
  event: KitchenInboundEvent,
  payload: unknown
) {
  if (event === 'pricing:config_updated') {
    invalidateKitchenPricing(queryClient);
    return;
  }

  if (event === 'notification:new') {
    void queryClient.invalidateQueries({
      queryKey: notificationKeys.all,
      refetchType: 'active',
    });
    return;
  }

  if (event === 'chat:new-message') {
    const chatOrderId = pickString(asRecord(payload), ['orderId', 'id']);
    if (chatOrderId) {
      void queryClient.invalidateQueries({
        queryKey: restaurantOrderKeys.handover(restaurantId, chatOrderId),
        refetchType: 'active',
      });
    }
    return;
  }

  if (event === 'typing' || event === 'call:masks' || event === 'call:internet') return;

  const record = asRecord(payload);
  const orderId = pickString(record, ['orderId', 'id', '_id']);

  if (event === 'kitchen:order-scheduled') {
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.scheduled(restaurantId),
    });
    return;
  }

  if (
    event === 'kitchen:order-new' ||
    event === 'kitchen:scheduled-due' ||
    event === 'kitchen:order-status' ||
    event === 'order:status' ||
    event === 'kitchen:order-cancelled'
  ) {
    if (!orderId) return;
    const fallback =
      event === 'kitchen:order-cancelled'
        ? 'cancelled'
        : event === 'kitchen:order-new' || event === 'kitchen:scheduled-due'
          ? 'placed'
          : undefined;
    const mapped = mapIncomingOrder(record, fallback);
    if (
      event === 'kitchen:order-cancelled' &&
      mapped.status !== 'returned' &&
      mapped.status !== 'cancelled_paid'
    ) {
      mapped.status = pickString(record, ['status']) ?? 'cancelled';
      mapped.rejectionReason =
        pickString(record, ['reason', 'cancellationReason']) ??
        mapped.rejectionReason;
    }
    // Only "new" events add a row; status pings for unseen tickets (e.g. future scheduled) just refetch.
    const insert = event === 'kitchen:order-new' || event === 'kitchen:scheduled-due';
    patchList(queryClient, restaurantId, orderId, mapped, insert);
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.restaurant(restaurantId),
      refetchType: 'active',
    });
    if (event === 'kitchen:scheduled-due') {
      void queryClient.invalidateQueries({
        queryKey: restaurantOrderKeys.scheduled(restaurantId),
      });
    }
    if (
      mapped.status === 'delivered' ||
      mapped.status === 'cancelled' ||
      mapped.status === 'cancelled_paid' ||
      mapped.status === 'returned'
    ) {
      refreshEarnings(queryClient, restaurantId);
    }
    return;
  }

  if (event === 'delivery:status') {
    if (!orderId) return;
    const tripStatus = pickString(record, ['status', 'deliveryStatus']);
    if (tripStatus === 'delivered' || tripStatus === 'returned') {
      refreshEarnings(queryClient, restaurantId);
    }
    if (tripStatus) {
      patchList(queryClient, restaurantId, orderId, {
        deliveryTripStatus: tripStatus,
      });
      const kdsKey = restaurantOrderKeys.kds(restaurantId);
      queryClient.setQueryData(
        kdsKey,
        (board: KitchenKdsBoard | undefined) => {
          if (!board) return board;
          const list = queryClient.getQueryData<OwnerOrder[]>(
            restaurantOrderKeys.list(restaurantId)
          );
          const all = [
            ...board.new,
            ...board.preparing,
            ...board.ready,
            ...board.delayed,
          ];
          const found =
            all.find((row) => row.id === orderId) ??
            list?.find((row) => row.id === orderId);
          const drop = (rows: OwnerOrder[]) =>
            rows.filter((row) => row.id !== orderId);
          const next: KitchenKdsBoard = {
            new: drop(board.new),
            preparing: drop(board.preparing),
            ready: drop(board.ready),
            delayed: drop(board.delayed),
          };
          if (tripStatus === 'returning_to_restaurant' && found) {
            next.ready.unshift({
              ...found,
              deliveryTripStatus: tripStatus,
            });
            return next;
          }
          if (tripStatus === 'returned' || tripStatus === 'failed') {
            return next;
          }
          return board;
        }
      );
    }
    void queryClient.invalidateQueries({
      queryKey: ['delivery-partners', 'order', orderId, 'partner'],
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.detail(restaurantId, orderId),
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.handover(restaurantId, orderId),
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.rider(restaurantId, orderId),
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: [...restaurantOrderKeys.detail(restaurantId, orderId), 'tracking'],
      refetchType: 'active',
    });
    return;
  }

  if (event === 'kitchen:rider-assigned' || event === 'kitchen:rider-arrived') {
    if (!orderId) return;
    const status = pickString(record, ['status']);
    patchList(queryClient, restaurantId, orderId, {
      ...(status && !status.includes('_') ? { status } : {}),
    });
    void queryClient.invalidateQueries({
      queryKey: ['delivery-partners', 'order', orderId, 'partner'],
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.detail(restaurantId, orderId),
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.handover(restaurantId, orderId),
      refetchType: 'active',
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.rider(restaurantId, orderId),
      refetchType: 'active',
    });
    return;
  }

  if (event === 'order:items-removed') {
    if (!orderId) return;
    const totalRaw = record.newTotal ?? record.grandTotal ?? record.total;
    const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw);
    patchList(queryClient, restaurantId, orderId, {
      ...(Number.isFinite(total) ? { total } : {}),
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.detail(restaurantId, orderId),
      refetchType: 'active',
    });
    return;
  }

  if (event === 'payment:cod-paid') {
    if (!orderId) return;
    patchList(queryClient, restaurantId, orderId, {
      paymentStatus: 'paid',
      paymentMethod: pickString(record, ['method', 'paymentMethod']) ?? 'cod',
    });
    void queryClient.invalidateQueries({
      queryKey: restaurantOrderKeys.detail(restaurantId, orderId),
      refetchType: 'active',
    });
    return;
  }
}
