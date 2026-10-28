import { useMemo } from 'react';

import { isCodPayment } from '@/lib/delivery-partner/finance-types';
import { useTripOrderContext } from '@/lib/delivery-partner/hooks';
import type { PartnerDelivery, TripOrderContext } from '@/lib/delivery-partner/types';

function itemsSummary(ctx: TripOrderContext): string | undefined {
  const names = ctx.items
    .filter((item) => item.name.trim())
    .map((item) => (item.quantity > 1 ? `${item.quantity}× ${item.name}` : item.name));
  return names.length ? names.join(', ') : undefined;
}

/** Delivery DTO has no order/customer/payment fields — fill them from order-context. */
export function mergeOrderContext(
  delivery: PartnerDelivery,
  ctx?: TripOrderContext | null
): PartnerDelivery {
  if (!ctx) return delivery;
  const cod = isCodPayment(ctx.paymentMethod ?? undefined);
  const paid = (ctx.paymentStatus ?? '').toLowerCase() === 'paid';
  const codDue = ctx.bill?.partner.codCollect ?? (cod ? ctx.grandTotal : null);
  const itemCount = ctx.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  return {
    ...delivery,
    orderNumber: delivery.orderNumber || ctx.orderNumber || undefined,
    restaurantName: delivery.restaurantName || ctx.restaurantName || undefined,
    restaurantPhone: delivery.restaurantPhone || ctx.restaurantPhone || undefined,
    customerName: delivery.customerName || ctx.customerName || undefined,
    customerPhone: delivery.customerPhone || ctx.customerPhone || undefined,
    itemsSummary: delivery.itemsSummary || itemsSummary(ctx),
    itemCount: delivery.itemCount ?? (itemCount || undefined),
    paymentMethod: ctx.paymentMethod ?? delivery.paymentMethod,
    amount: cod && codDue != null ? codDue : ctx.grandTotal,
    currency: ctx.bill?.currency ?? delivery.currency,
    settledVia: delivery.settledVia ?? (cod && paid ? 'upi' : null),
  };
}

export function useTripWithOrder(
  delivery: PartnerDelivery,
  options?: { enabled?: boolean; live?: boolean }
) {
  const orderContext = useTripOrderContext(
    delivery.id,
    options?.enabled ?? true,
    { live: options?.live }
  );
  const merged = useMemo(
    () => mergeOrderContext(delivery, orderContext.data),
    [delivery, orderContext.data]
  );
  return { delivery: merged, orderContext };
}
