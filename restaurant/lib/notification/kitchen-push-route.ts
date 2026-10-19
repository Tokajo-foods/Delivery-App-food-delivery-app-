type Route = string | { pathname: string; params: Record<string, string> };

function text(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

/** Where a tapped kitchen push (or inbox row) should land. */
export function kitchenRouteForPush(data: Record<string, unknown>): Route {
  const kind = text(data.kind) || text(data.type);
  const screen = text(data.screen);
  const action = text(data.action);
  const messageKind = text(data.messageKind);
  const category = text(data.category);
  const orderId = text(data.orderId);

  if (kind === 'restaurant_chat' && orderId) {
    return { pathname: '/order/chat/[orderId]', params: { orderId } };
  }
  if (orderId && (screen === 'order' || kind.startsWith('kitchen_') || kind === 'order_update')) {
    return `/order/${encodeURIComponent(orderId)}`;
  }
  if (screen === 'payouts' || kind === 'kitchen_payout') return '/payouts';
  if (screen === 'onboarding' || action.includes('kyc') || messageKind.startsWith('kyc_') || action === 'listing_approved') {
    return '/onboarding';
  }
  if (text(data.reviewId)) return '/reviews';
  if (text(data.ticketId) || category === 'support' || messageKind.startsWith('support_')) return '/support';
  if (category === 'catalog_moderation') return '/menu';
  if (messageKind === 'admin_force_offline' || messageKind === 'admin_resume_online') return '/dashboard';
  if (orderId) return `/order/${encodeURIComponent(orderId)}`;

  const k = kind.toLowerCase();
  if (k.includes('review') || k.includes('rating')) return '/reviews';
  if (k.includes('payout') || k.includes('settle') || k.includes('invoice')) return '/payouts';
  if (k.includes('support') || k.includes('ticket')) return '/support';
  if (k.includes('offer') || k.includes('promo')) return '/offers';
  if (k.includes('order') || k.includes('kitchen')) return '/orders';
  return '/notifications';
}

/** Inbox rows carry the notification `type` beside `data`; route them exactly like the push. */
export function kitchenRouteForInboxItem(item: {
  type: string;
  data?: Record<string, unknown> | null;
}): Route {
  const data = item.data ?? {};
  return kitchenRouteForPush({ ...data, type: text(data.type) || item.type });
}
