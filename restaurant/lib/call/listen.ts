import { subscribeKitchenEvents, trackKitchenOrder } from '@/lib/gateway/kitchen-client';
import { subscribeRiderGateway, trackRiderOrder } from '@/lib/delivery-partner/rider-gateway';
import type { ViewerKind } from '@/lib/call/types';

export function listenOrderCallEvents(
  viewer: ViewerKind,
  orderId: string,
  onEvent: (event: 'call:masks' | 'call:internet', payload: unknown) => void
): () => void {
  if (viewer === 'rider') {
    trackRiderOrder(orderId);
    return subscribeRiderGateway((event, payload) => {
      if (event === 'call:masks' || event === 'call:internet') onEvent(event, payload);
    });
  }
  trackKitchenOrder(orderId);
  return subscribeKitchenEvents((event, payload) => {
    if (event === 'call:masks' || event === 'call:internet') onEvent(event, payload);
  });
}
