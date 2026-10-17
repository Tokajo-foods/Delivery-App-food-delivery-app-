/**
 * Kitchen bill helpers — server `order.bill.restaurant` is the source of truth.
 * Kitchen earn = food items − discount − admin commission. Never packaging, GST, or delivery.
 * Commission amount and "you earn" are only ever read from the server bill. The current
 * rule % from GET /restaurants/:id/commission is shown as a label, never multiplied here.
 */

export type RestaurantBill = {
  itemTotal: number;
  discount: number;
  restaurantCharges: number;
  /** null until the server commission is known. */
  commissionPercent: number | null;
  commissionAmount: number | null;
  youEarn: number | null;
};

export type CentralBillPayload = {
  restaurant?: {
    itemTotal?: number;
    packagingCharge?: number;
    taxAmount?: number;
    discount?: number;
    restaurantCharges?: number;
    commissionPercent?: number;
    commissionAmount?: number;
    youEarn?: number;
  };
  customer?: Record<string, unknown>;
  partner?: Record<string, unknown>;
};

type OrderLike = {
  subtotal?: number;
  tax?: number;
  discount?: number;
  packagingCharge?: number;
  total?: number;
  grandTotal?: number;
  items?: Array<{ price?: number; quantity?: number; itemTotal?: number }>;
  bill?: CentralBillPayload | null;
};

function money(n: number): number {
  return Math.round(Math.max(0, n) * 100) / 100;
}

function finitePct(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}

function fromServer(
  bill: NonNullable<CentralBillPayload['restaurant']>,
  fallbackPercent: number | null,
): RestaurantBill {
  return {
    itemTotal: money(Number(bill.itemTotal) || 0),
    discount: money(Number(bill.discount) || 0),
    restaurantCharges: money(Number(bill.restaurantCharges) || 0),
    commissionPercent: finitePct(bill.commissionPercent) ?? fallbackPercent,
    commissionAmount: money(Number(bill.commissionAmount) || 0),
    youEarn: money(Number(bill.youEarn) || 0),
  };
}

function serverBillUsable(
  bill: NonNullable<CentralBillPayload['restaurant']> | undefined,
): bill is NonNullable<CentralBillPayload['restaurant']> {
  if (!bill || typeof bill !== 'object') return false;
  const charges = Number(bill.restaurantCharges);
  const items = Number(bill.itemTotal);
  const earn = Number(bill.youEarn);
  return (
    (Number.isFinite(charges) && charges > 0)
    || (Number.isFinite(items) && items > 0)
    || (Number.isFinite(earn) && earn > 0)
  );
}

/**
 * Kitchen-facing bill: food − discount, then admin commission % → you earn.
 * `serverCommissionPercent` is the outlet's current rule from the commission API.
 */
export function buildRestaurantBill(
  order: OrderLike,
  serverCommissionPercent?: number | null,
): RestaurantBill {
  const fallbackPercent = finitePct(serverCommissionPercent);
  if (serverBillUsable(order.bill?.restaurant)) {
    return fromServer(order.bill!.restaurant!, fallbackPercent);
  }

  // No server bill yet: show server order amounts only; commission and earn stay unknown.
  const itemTotal = money(Number(order.subtotal ?? 0));
  const discount = money(Number(order.discount ?? 0));
  let restaurantCharges = money(itemTotal - discount);
  // Kitchen `grandTotal` is item total after toKitchenOrderView — not customer payable.
  if (restaurantCharges <= 0) {
    const fallback = Number(order.total ?? order.grandTotal ?? 0);
    if (Number.isFinite(fallback) && fallback > 0) restaurantCharges = money(fallback);
  }
  return {
    itemTotal: itemTotal > 0 ? itemTotal : restaurantCharges,
    discount,
    restaurantCharges,
    commissionPercent: fallbackPercent,
    commissionAmount: null,
    youEarn: null,
  };
}

/** List / card total for kitchen — restaurant charges before commission. */
export function resolveRestaurantOrderTotal(order: OrderLike): number {
  return buildRestaurantBill(order).restaurantCharges;
}
