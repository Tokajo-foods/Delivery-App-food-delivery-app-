import type { PartnerEarningsSummary } from '@/lib/delivery-partner/analytics-types';
import type { PartnerDutySummary } from '@/lib/delivery-partner/availability-types';

/** One IST-today snapshot shared by Home, Earnings, and duty cards. */
export type PartnerTodayStats = {
  onlineMinutes: number;
  trips: number;
  km: number;
  earnings: number;
  currency: string;
  date?: string;
};

export function selectPartnerTodayStats(
  duty?: PartnerDutySummary | null,
  earnings?: PartnerEarningsSummary | null
): PartnerTodayStats {
  const ledgerTrips = earnings?.today.totalDeliveries ?? 0;
  const dutyTrips = duty?.deliveries ?? 0;
  const ledgerPay = earnings?.today.totalEarnings;
  const dutyPay = duty?.earnings;
  const pay =
    ledgerPay != null && Number.isFinite(ledgerPay)
      ? ledgerPay
      : dutyPay != null && Number.isFinite(dutyPay)
        ? dutyPay
        : 0;
  return {
    onlineMinutes: duty?.onlineMinutes ?? 0,
    trips: Math.max(dutyTrips, ledgerTrips),
    km: duty?.km ?? 0,
    earnings: pay,
    currency: earnings?.currency ?? 'INR',
    date: duty?.date,
  };
}
