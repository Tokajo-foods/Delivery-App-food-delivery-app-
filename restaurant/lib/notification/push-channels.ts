type NotificationsModule = typeof import('expo-notifications');

/**
 * Android channel ids. They must match notification-service (`kitchenPushStyle.ts`,
 * `riderOfferNotify.ts`). Android freezes a channel's sound/importance once created —
 * change behaviour with a new id, never by editing an existing one.
 */
export const DELIVERY_ALERTS_CHANNEL_ID = 'tokajo-delivery-alerts';
/** v2: v1 had no lock-screen visibility or bell. */
export const RIDER_OFFER_CHANNEL_ID = 'tokajo-rider-offers-v2';
export const KITCHEN_ORDER_BELL_CHANNEL_ID = 'tokajo-kitchen-order-bell';
export const KITCHEN_ORDER_QUIET_CHANNEL_ID = 'tokajo-kitchen-order-quiet';
export const KITCHEN_ORDER_ALERTS_CHANNEL_ID = 'tokajo-kitchen-orders';
export const KITCHEN_UPDATES_CHANNEL_ID = 'tokajo-kitchen-updates';

export async function ensureAndroidPushChannels(N: NotificationsModule): Promise<void> {
  const PUBLIC = N.AndroidNotificationVisibility.PUBLIC;
  await N.setNotificationChannelAsync(DELIVERY_ALERTS_CHANNEL_ID, {
    name: 'Delivery alerts',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#7A0E22',
    sound: 'default',
  });
  await N.setNotificationChannelAsync(RIDER_OFFER_CHANNEL_ID, {
    name: 'New delivery offers',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 160, 400, 160, 520],
    lightColor: '#16A34A',
    sound: 'order_bell',
    lockscreenVisibility: PUBLIC,
  });
  await N.deleteNotificationChannelAsync('tokajo-rider-offers').catch(() => undefined);
  await N.setNotificationChannelAsync(KITCHEN_ORDER_BELL_CHANNEL_ID, {
    name: 'New orders (bell)',
    description: 'Rings the order bell for new and unaccepted orders, including on the lock screen.',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500],
    lightColor: '#EA4B14',
    sound: 'order_bell',
    lockscreenVisibility: PUBLIC,
    bypassDnd: true,
  });
  await N.setNotificationChannelAsync(KITCHEN_ORDER_QUIET_CHANNEL_ID, {
    name: 'New orders (silent)',
    description: 'Used when the order bell is turned off, and for future scheduled orders.',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 200],
    lightColor: '#EA4B14',
    sound: null,
    lockscreenVisibility: PUBLIC,
  });
  await N.setNotificationChannelAsync(KITCHEN_ORDER_ALERTS_CHANNEL_ID, {
    name: 'Order alerts',
    description: 'Cancellations, rider at your counter, and returned orders.',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400],
    lightColor: '#7A0E22',
    sound: 'default',
    lockscreenVisibility: PUBLIC,
  });
  await N.setNotificationChannelAsync(KITCHEN_UPDATES_CHANNEL_ID, {
    name: 'Account & updates',
    description: 'Documents, listing status, payouts, reviews, support and messages from TOKAJO.',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: '#7A0E22',
    sound: 'default',
    lockscreenVisibility: PUBLIC,
  });
}
