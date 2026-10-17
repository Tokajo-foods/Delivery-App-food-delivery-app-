export const KITCHEN_INBOUND_EVENTS = [
  'kitchen:order-new',
  'kitchen:order-status',
  'kitchen:order-cancelled',
  'kitchen:rider-assigned',
  'kitchen:rider-arrived',
  'kitchen:scheduled-due',
  'order:status',
  'order:items-removed',
  'delivery:status',
  'payment:cod-paid',
  'notification:new',
  'chat:new-message',
  'typing',
  'tracking:location',
  'partner:location',
  'call:masks',
  'call:internet',
  'pricing:config_updated',
] as const;

export type KitchenInboundEvent = (typeof KITCHEN_INBOUND_EVENTS)[number];
