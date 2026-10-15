import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { pushLiveToast } from '@/lib/delivery-partner/live-toast-store';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import {
  alertNewOffer,
  getIncomingOffer,
  isOfferDeclined,
  parseIncomingOffer,
  setIncomingOffer,
  type IncomingOffer,
} from '@/lib/delivery-partner/offer-store';
import {
  getNotificationsModule,
  setForegroundNotificationFilter,
} from '@/lib/notification/device-alerts';

const OFFER_KIND = 'rider_new_offer';
/** Survives remounts so a cold-start tap is never handled twice in one app session. */
const handledResponses = new Set<string>();

function isOfferPush(data: Record<string, unknown>): boolean {
  return String(data.kind ?? '') === OFFER_KIND;
}

/** Rebuilds the offer popup from the push `offer` JSON. Null when expired or already declined. */
export function offerFromPushData(data: Record<string, unknown>): IncomingOffer | null {
  if (!isOfferPush(data)) return null;
  let raw: unknown = data.offer;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = null;
    }
  }
  const offer = parseIncomingOffer(raw ?? data);
  if (!offer) return null;
  if (offer.expiresAt) {
    const ms = Date.parse(offer.expiresAt);
    if (Number.isFinite(ms) && ms <= Date.now()) return null;
  }
  if (isOfferDeclined(offer.deliveryId, offer.orderId)) return null;
  return offer;
}

function readData(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

/**
 * Offer pushes from notification-service:
 * - app open: no banner, the socket popup (or this push, if the socket missed it) shows the offer
 * - tap from tray / lock screen (even a cold start): open Orders with the accept popup
 */
export function useRiderOfferPush(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    setForegroundNotificationFilter((data) => {
      if (!isOfferPush(data)) return true;
      const offer = offerFromPushData(data);
      if (offer && getIncomingOffer()?.deliveryId !== offer.deliveryId) {
        setIncomingOffer(offer);
        alertNewOffer();
      }
      return false;
    });

    const open = (responseId: string, data: Record<string, unknown>) => {
      if (!isOfferPush(data) || handledResponses.has(responseId)) return;
      handledResponses.add(responseId);
      const offer = offerFromPushData(data);
      if (offer) {
        setIncomingOffer(offer);
      } else {
        pushLiveToast({
          title: 'Offer expired',
          body: 'This order is no longer available. Stay online for the next one.',
          tone: 'warn',
        });
      }
      router.push(DELIVERY_ROUTES.orders as never);
    };

    const Notifications = getNotificationsModule();
    if (!Notifications) {
      return () => setForegroundNotificationFilter(null);
    }

    let alive = true;
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!alive || !response) return;
        open(
          `${response.notification.request.identifier}:${response.actionIdentifier}`,
          readData(response.notification.request.content.data)
        );
      })
      .catch(() => undefined);

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      open(
        `${response.notification.request.identifier}:${response.actionIdentifier}`,
        readData(response.notification.request.content.data)
      );
    });

    return () => {
      alive = false;
      sub.remove();
      setForegroundNotificationFilter(null);
    };
  }, [enabled, router]);
}
