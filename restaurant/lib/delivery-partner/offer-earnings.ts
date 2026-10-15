import {
  resolvePartnerTripPay,
  type PartnerTripPay,
} from '@/lib/delivery-partner/partner-earnings';
import type { IncomingOffer } from '@/lib/delivery-partner/offer-store';

export type OfferEarnings = PartnerTripPay;

export function resolveOfferEarnings(offer: IncomingOffer): OfferEarnings | null {
  const fromParts = resolvePartnerTripPay({
    deliveryFee: offer.deliveryFee,
    partnerEarnings: offer.partnerEarnings,
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

export function formatInr(amount: number) {
  const n = Math.round(Math.max(0, amount) * 100) / 100;
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
