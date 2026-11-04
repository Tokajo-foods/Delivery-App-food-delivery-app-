import type { IncomingOffer } from '@/lib/delivery-partner/offer-store';
import {
  estimateLegEtaMinutes,
  haversineKm,
} from '@/lib/delivery-partner/offer-geo';
import type { GoogleRoadLeg } from '@/lib/delivery-partner/google-road-distance';
import { formatTripError } from '@/lib/delivery-partner/rider-ack';
import { getApiErrorCode } from '@/lib/errors';

const OFFER_GONE_CODES = new Set([
  'OFFER_EXPIRED',
  'OFFER_TAKEN',
  'BATCH_EXPIRED',
  'BATCH_NOT_FOUND',
  'BATCH_INCOMPLETE',
]);

export function remainingSeconds(offer: IncomingOffer) {
  if (offer.secondsLeft != null && Number.isFinite(offer.secondsLeft)) {
    return Math.max(0, Math.ceil(offer.secondsLeft));
  }
  if (offer.expiresAt) {
    const ms = Date.parse(offer.expiresAt) - Date.now();
    if (Number.isFinite(ms)) return Math.max(0, Math.ceil(ms / 1000));
  }
  const elapsed = (Date.now() - offer.receivedAt) / 1000;
  return Math.max(0, Math.ceil(offer.timeoutSeconds - elapsed));
}

export function shouldClearOffer(error: unknown) {
  const code = getApiErrorCode(error);
  if (code && OFFER_GONE_CODES.has(code)) return true;
  const message = formatTripError(error, '').toLowerCase();
  return (
    message.includes('timed out') ||
    message.includes('another rider') ||
    message.includes('no longer')
  );
}

function validPair(
  lat?: number | null,
  lng?: number | null
): [number, number] | null {
  if (lat == null || lng == null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return [lat, lng];
}

export function resolvePickupKm(
  offer: IncomingOffer,
  riderLat?: number | null,
  riderLng?: number | null
) {
  const rider = validPair(riderLat, riderLng);
  const store = validPair(offer.restaurantLat, offer.restaurantLng);
  if (rider && store) {
    return haversineKm(rider[0], rider[1], store[0], store[1]);
  }
  if (offer.pickupDistanceKm != null && offer.pickupDistanceKm > 0) {
    return offer.pickupDistanceKm;
  }
  return null;
}

export function resolveDropKm(offer: IncomingOffer) {
  const store = validPair(offer.restaurantLat, offer.restaurantLng);
  const drop = validPair(offer.dropLat, offer.dropLng);
  if (store && drop) {
    return haversineKm(store[0], store[1], drop[0], drop[1]);
  }
  if (offer.dropDistanceKm != null && offer.dropDistanceKm > 0) {
    return offer.dropDistanceKm;
  }
  return offer.estimatedKm ?? null;
}

export type OfferTripMetrics = {
  pickupKm: number | null;
  dropKm: number | null;
  pickupEtaMin: number | null;
  dropEtaMin: number | null;
  totalEtaMin: number | null;
  /** True when shown km is Google driving distance. */
  isRoadKm: boolean;
  roadLoading: boolean;
};

/**
 * Prefer Google driving km. While loading / if Google fails, do not paint
 * straight-line km as if it were road distance (that caused the 7.4 vs 13 gap).
 */
export function resolveOfferTripMetrics(
  offer: IncomingOffer,
  riderLat?: number | null,
  riderLng?: number | null,
  roadLegs?: GoogleRoadLeg[] | null,
  roadLoading = false
): OfferTripMetrics {
  const pickupRoad = roadLegs?.find((l) => l.id === 'pickup');
  const dropRoad = roadLegs?.find((l) => l.id === 'drop');
  const hasGoogle = Boolean(
    (pickupRoad && pickupRoad.distanceKm > 0) ||
      (dropRoad && dropRoad.distanceKm > 0)
  );

  if (roadLoading && !hasGoogle) {
    return {
      pickupKm: null,
      dropKm: null,
      pickupEtaMin: null,
      dropEtaMin: null,
      totalEtaMin: null,
      isRoadKm: false,
      roadLoading: true,
    };
  }

  if (hasGoogle) {
    const pickupKm =
      pickupRoad && pickupRoad.distanceKm > 0 ? pickupRoad.distanceKm : null;
    const dropKm =
      dropRoad && dropRoad.distanceKm > 0 ? dropRoad.distanceKm : null;
    const pickupEtaMin = pickupRoad?.etaMinutes ?? null;
    const dropEtaMin = dropRoad?.etaMinutes ?? null;
    const totalEtaMin =
      pickupEtaMin != null || dropEtaMin != null
        ? (pickupEtaMin ?? 0) + (dropEtaMin ?? 0)
        : null;
    return {
      pickupKm,
      dropKm,
      pickupEtaMin,
      dropEtaMin,
      totalEtaMin,
      isRoadKm: true,
      roadLoading: false,
    };
  }

  // Google failed — last-resort aerial (labeled approx in UI).
  const aerialPickup = resolvePickupKm(offer, riderLat, riderLng);
  const aerialDrop = resolveDropKm(offer);
  const pickupEtaMin = estimateLegEtaMinutes(aerialPickup);
  const dropEtaMin = estimateLegEtaMinutes(aerialDrop);
  return {
    pickupKm: aerialPickup,
    dropKm: aerialDrop,
    pickupEtaMin,
    dropEtaMin,
    totalEtaMin:
      pickupEtaMin != null || dropEtaMin != null
        ? (pickupEtaMin ?? 0) + (dropEtaMin ?? 0)
        : null,
    isRoadKm: false,
    roadLoading: false,
  };
}
