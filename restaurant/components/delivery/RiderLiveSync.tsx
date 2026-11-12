import { IncomingOfferOverlay } from '@/components/delivery/orders/IncomingOfferOverlay';
import { TripRatingHost } from '@/components/delivery/orders/TripRatingHost';
import { BackgroundLocationDisclosure } from '@/components/delivery/shared/BackgroundLocationDisclosure';
import { useRiderOfferPush } from '@/lib/delivery-partner/offer-push';
import { usePartnerPricingRules } from '@/lib/delivery-partner/pricing-hooks';
import { usePartnerLocationSync } from '@/lib/delivery-partner/use-partner-location-sync';
import { useRiderGatewaySocket } from '@/lib/delivery-partner/use-rider-gateway';
import { useAuthStore } from '@/store/auth-store';

/**
 * Keeps rider socket + GPS sync alive and mounts the incoming-offer popup globally.
 * Push notification permission is requested when the partner goes online (system dialog).
 */
export function RiderLiveSync() {
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role ?? s.role);
  const enabled = Boolean(token) && role === 'delivery';

  useRiderGatewaySocket(enabled);
  usePartnerLocationSync(enabled);
  usePartnerPricingRules(enabled);
  useRiderOfferPush(enabled);

  if (!enabled) return null;
  return (
    <>
      <BackgroundLocationDisclosure />
      <IncomingOfferOverlay />
      <TripRatingHost />
    </>
  );
}
