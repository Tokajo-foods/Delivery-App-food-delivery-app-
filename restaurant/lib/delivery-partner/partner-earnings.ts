/**
 * Rider pay is server-computed: `partnerEarnings` (delivery fee after commission) and the
 * final payout come from delivery-service. Without them the amount is unknown — never derived here.
 * Commission % (display only) comes from the trip payload or GET /partners/me/config/pricing-rules.
 */

export type PartnerTripPay = {
  basePay: number;
  incentive: number;
  tip: number;
  /** Server final payout only; null until the payload carries it. */
  netTotal: number | null;
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

export function resolvePartnerTripPay(input: {
  deliveryFee?: number;
  partnerEarnings?: number;
  incentiveBonus?: number;
  tipAmount?: number;
  /** Server final payout (`netEarnings` / `payout.finalAmount`) when the payload has it. */
  netTotal?: number;
  commissionPercent?: number;
  partnerSharePct?: number;
  platformCommissionPct?: number;
}): PartnerTripPay | null {
  const commissionPercent = resolveCommissionPercent({
    platformCommissionPct: input.platformCommissionPct ?? input.commissionPercent,
    partnerSharePct: input.partnerSharePct,
  });
  const basePay = input.partnerEarnings;
  if (basePay == null || !Number.isFinite(basePay)) return null;

  const incentive = Math.max(0, input.incentiveBonus ?? 0);
  const tip = Math.max(0, input.tipAmount ?? 0);
  const serverNet = input.netTotal;
  return {
    basePay,
    incentive,
    tip,
    netTotal: serverNet != null && Number.isFinite(serverNet) ? serverNet : null,
    commissionPercent,
    showIncentive: incentive > 0,
  };
}
