export type EarningsPeriod = 'today' | 'week' | 'month';

export type PassbookFilter = 'all' | 'order_credit' | 'payout_debit' | 'adjustment';

export type PassbookEntryKind = 'order' | 'rto_credit' | 'payout' | 'adjustment';

export type EarningsPeriodTotals = {
  period: EarningsPeriod;
  from: string;
  to: string;
  orders: number;
  deliveredOrders: number;
  returnedOrders: number;
  grossSales: number;
  commission: number;
  orderEarnings: number;
  returnedEarnings: number;
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
