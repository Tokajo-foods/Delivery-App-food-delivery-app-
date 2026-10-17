/**
 * Rider net pay — delivery fee minus platform commission; incentive/tip added as-is.
 * Prefer the server `partnerEarnings` on the trip/offer. Commission % only comes from
 * the trip payload or GET /partners/me/config/pricing-rules — never a local constant.
 */

export type PartnerTripPay = {
  basePay: number;
  incentive: number;
  tip: number;
  netTotal: number;
  commissionPercent: number | null;
  showIncentive: boolean;
};

let cachedCommissionPct: number | null = null;

function validPct(pct: number | null | undefined): pct is number {
  return pct != null && Number.isFinite(pct) && pct >= 0 && pct <= 100;
}

export function setPartnerCommissionPercent(pct: number | null) {
  cachedCommissionPct = validPct(pct) ? pct : null;
}

export function resolveCommissionPercent(input?: {
  platformCommissionPct?: number;
  partnerSharePct?: number;
}): number | null {
  if (validPct(input?.platformCommissionPct)) return input.platformCommissionPct;
  if (validPct(input?.partnerSharePct)) return Math.max(0, 100 - input.partnerSharePct);
  return cachedCommissionPct;
}

export function partnerNetFromDeliveryFee(deliveryFee: number, commissionPercent: number): number {
  const rate = commissionPercent > 1 ? commissionPercent / 100 : commissionPercent;
  return Math.round(Math.max(0, deliveryFee) * (1 - rate) * 100) / 100;
}

export function resolvePartnerTripPay(input: {
  deliveryFee?: number;
  partnerEarnings?: number;
  incentiveBonus?: number;
  tipAmount?: number;
  commissionPercent?: number;
  partnerSharePct?: number;
  platformCommissionPct?: number;
}): PartnerTripPay | null {
  const fee = input.deliveryFee;
  const commissionPercent = resolveCommissionPercent({
    platformCommissionPct: input.platformCommissionPct ?? input.commissionPercent,
    partnerSharePct: input.partnerSharePct,
  });
  const basePay =
    input.partnerEarnings ??
    (fee != null && Number.isFinite(fee) && commissionPercent != null
      ? partnerNetFromDeliveryFee(fee, commissionPercent)
      : null);
  if (basePay == null || !Number.isFinite(basePay)) return null;

  const incentive = Math.max(0, input.incentiveBonus ?? 0);
  const tip = Math.max(0, input.tipAmount ?? 0);
  return {
    basePay,
    incentive,
    tip,
    netTotal: basePay + incentive + tip,
    commissionPercent,
    showIncentive: incentive > 0,
  };
}

export function resolvePartnerDisplayEarning(input: {
  deliveryFee?: number;
  partnerEarnings?: number;
  incentiveBonus?: number;
  tipAmount?: number;
}): number | undefined {
  const pay = resolvePartnerTripPay(input);
  return pay?.netTotal;
}
