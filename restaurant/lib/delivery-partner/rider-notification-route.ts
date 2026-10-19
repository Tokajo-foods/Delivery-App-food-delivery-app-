import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

export type RiderNotificationHref =
  | string
  | { pathname: string; params: Record<string, string> };

function readId(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

/** Where a rider inbox row or push tap should land. Null keeps the rider on the inbox. */
export function riderRouteForNotification(
  type: string,
  data: Record<string, unknown> = {}
): RiderNotificationHref | null {
  const kind = String(data.kind ?? '').toLowerCase();
  const screen = String(data.screen ?? '').toLowerCase();
  const t = type.toLowerCase();

  if (screen === 'documents' || kind.includes('kyc') || t.includes('kyc')) {
    return DELIVERY_ROUTES.documents;
  }

  const deliveryId = readId(data.deliveryId ?? data.delivery_id);
  const orderId = readId(data.orderId ?? data.order_id ?? data.order);
  if (deliveryId || orderId) {
    return {
      pathname: DELIVERY_ROUTES.orders,
      params: {
        ...(deliveryId ? { focusDelivery: deliveryId } : {}),
        ...(orderId ? { focusOrder: orderId } : {}),
      },
    };
  }

  if (
    screen === 'earnings' ||
    t.includes('earn') ||
    t.includes('pay') ||
    t.includes('wallet') ||
    kind.includes('payout') ||
    kind.includes('wallet')
  ) {
    return DELIVERY_ROUTES.earnings;
  }
  if (screen === 'incentives' || kind.includes('incentive')) {
    return DELIVERY_ROUTES.incentives;
  }
  if (screen === 'support' || t.includes('support') || readId(data.ticketId)) {
    return DELIVERY_ROUTES.support;
  }
  return null;
}
