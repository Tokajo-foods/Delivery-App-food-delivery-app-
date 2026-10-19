import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

import type { PartnerDelivery } from '@/lib/delivery-partner/types';

type Params = { focusDelivery?: string; focusOrder?: string };

/**
 * Opens the trip a notification pointed at (`/delivery/orders?focusDelivery=` or `?focusOrder=`).
 * Waits until the live and history lists have loaded, then clears the params so it fires once.
 */
export function useFocusTripParam(input: {
  liveOrders: PartnerDelivery[];
  pastOrders: PartnerDelivery[];
  ready: boolean;
  openTrip: (trip: PartnerDelivery, inHistory: boolean) => void;
}) {
  const { focusDelivery, focusOrder } = useLocalSearchParams<Params>();
  const router = useRouter();
  const { liveOrders, pastOrders, ready, openTrip } = input;

  useEffect(() => {
    const deliveryId = focusDelivery?.trim();
    const orderId = focusOrder?.trim();
    if ((!deliveryId && !orderId) || !ready) return;
    const matches = (row: PartnerDelivery) =>
      (deliveryId && row.id === deliveryId) || (orderId && row.orderId === orderId);
    const live = liveOrders.find(matches);
    const past = live ? undefined : pastOrders.find(matches);
    if (live) openTrip(live, false);
    else if (past) openTrip(past, true);
    router.setParams({ focusDelivery: undefined, focusOrder: undefined });
  }, [focusDelivery, focusOrder, ready, liveOrders, pastOrders, openTrip, router]);
}
