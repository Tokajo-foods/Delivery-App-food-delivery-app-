export type EarningsPeriod = 'today' | 'week' | 'month';

export type PassbookFilter = 'all' | 'order_credit' | 'payout_debit' | 'adjustment';

export type PassbookEntryKind =
  | 'order'
  | 'rto_credit'
  | 'no_rider_credit'
  | 'payout'
  | 'adjustment';

export type EarningsPeriodTotals = {
  period: EarningsPeriod;
  from: string;
  to: string;
  orders: number;
  deliveredOrders: number;
  returnedOrders: number;
  /** Delivery orders cancelled after cooking because no rider came (kitchen still paid). */
  noRiderOrders: number;
  grossSales: number;
  commission: number;
  /** Actual wallet commission ÷ food sales for this period (from API). */
  commissionPercent?: number;
  /** All order credits (delivered + returned + no rider). */
  orderEarnings: number;
  returnedEarnings: number;
  noRiderEarnings: number;
  adjustments: number;
  adjustmentCount: number;
  netEarnings: number;
  payouts: number;
  payoutCount: number;
};

export type EarningsDay = {
  date: string;
  orders: number;
  netEarnings: number;
};

export type EarningsSummary = {
  restaurantId: string;
  generatedAt: string;
  balance: number;
  available: number;
  remaining: number;
  settled: number;
  lifetimeCredited: number;
  collectedAtStore: number;
  commissionPercent: number;
  periods: Record<EarningsPeriod, EarningsPeriodTotals>;
  daily: EarningsDay[];
};

export type PassbookEntry = {
  id: string;
  kind: PassbookEntryKind;
  orderId: string | null;
  orderNumber: string | null;
  payoutId: string | null;
  grossAmount: number | null;
  commissionAmount: number | null;
  commissionRate: number | null;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string | null;
};

export type PassbookPage = {
  items: PassbookEntry[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
};
