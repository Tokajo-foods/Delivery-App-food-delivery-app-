import {
  resolvePartnerTripPay,
  type PartnerTripPay,
} from '@/lib/delivery-partner/partner-earnings';
import type { IncomingOffer } from '@/lib/delivery-partner/offer-store';

export type OfferEarnings = PartnerTripPay;

export function resolveOfferEarnings(offer: IncomingOffer): OfferEarnings | null {
  const fromParts = resolvePartnerTripPay({
    deliveryFee: offer.deliveryFee,
    partnerEarnings: offer.payout?.rounded ?? offer.partnerEarnings,
    incentiveBonus: offer.incentiveBonus,
  });
  if (!fromParts) return null;
  const finalAmount = offer.payout?.finalAmount ?? offer.netEarnings;
  if (finalAmount != null && Number.isFinite(finalAmount)) {
    return {
      ...fromParts,
      basePay: offer.payout?.rounded ?? offer.partnerEarnings ?? fromParts.basePay,
      incentive: Math.max(0, offer.payout?.incentive ?? offer.incentiveBonus ?? 0),
      tip: Math.max(0, offer.payout?.tip ?? offer.tipAmount ?? 0),
      netTotal: finalAmount,
      showIncentive: (offer.payout?.incentive ?? offer.incentiveBonus ?? 0) > 0,
    };
  }
  return fromParts;
}

export { formatInr } from '@/lib/format/money';
