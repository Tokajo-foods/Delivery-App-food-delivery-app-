import type { useRouter } from 'expo-router';

import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import type { AppNotification } from '@/lib/notification/types';

function readId(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

export function openNotificationDeepLink(
  router: ReturnType<typeof useRouter>,
  item: AppNotification
) {
  const data = item.data ?? {};
  const kind = String(data.kind ?? '').toLowerCase();
  const screen = String(data.screen ?? '').toLowerCase();
  const type = item.type.toLowerCase();

  if (screen === 'documents' || kind.includes('kyc') || type.includes('kyc')) {
    router.push(DELIVERY_ROUTES.documents as never);
    return;
  }

  const deliveryId = readId(data.deliveryId ?? data.delivery_id);
  const orderId = readId(data.orderId ?? data.order_id ?? data.order);
  if (deliveryId || orderId) {
    router.push({
      pathname: DELIVERY_ROUTES.orders,
      params: {
        ...(deliveryId ? { focusDelivery: deliveryId } : {}),
        ...(orderId ? { focusOrder: orderId } : {}),
      },
    } as never);
    return;
  }

  if (type.includes('earn') || type.includes('pay') || type.includes('payout')) {
    router.push(DELIVERY_ROUTES.earnings as never);
    return;
  }
  if (type.includes('support') || readId(data.ticketId)) {
    router.push(DELIVERY_ROUTES.support as never);
  }
}
