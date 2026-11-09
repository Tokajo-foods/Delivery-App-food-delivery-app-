/**
 * Points shown on the mandatory partner acceptance sheet (Tokajo Restaurant).
 * Full text: /legal/terms and https://tokajofoods.com/terms
 */
export const RESTAURANT_PARTNER_TERMS_VERSION = '2026-03-01';

export type PartnerTermsPoint = {
  id: string;
  title: string;
  body: string;
};

export const RESTAURANT_PARTNER_TERMS_POINTS: PartnerTermsPoint[] = [
  {
    id: 'eligibility',
    title: 'Eligibility and account',
    body:
      'You are 18 or older, sign up with your own name and mobile number, and keep login details private. You are responsible for staff you invite and what they do in the app.',
  },
  {
    id: 'outlet',
    title: 'Outlet and documents',
    body:
      'Restaurant name, pin on the map, hours, menu, FSSAI, GST, PAN, and bank details must be accurate. The outlet stays pending and cannot take new orders until Tokajo approves it.',
  },
  {
    id: 'menu-orders',
    title: 'Menu and orders',
    body:
      'Prices, veg or non-veg marks, and photos must match what you serve. Accept only orders you can prepare, mark food ready when packed, and mark items unavailable when the kitchen cannot make them.',
  },
  {
    id: 'handover',
    title: 'Handover and returns',
    body:
      'Confirm pickup with the code or in-app handover when the order leaves the kitchen. For a failed delivery, confirm a return only after the rider is at the store with the food.',
  },
  {
    id: 'fees',
    title: 'Fees, tax, and payouts',
    body:
      'Commission and fees shown in the app apply to settled orders. Payouts go only to a verified bank account or UPI you provide. You handle outlet taxes and lawful invoices.',
  },
  {
    id: 'calls',
    title: 'Calls, privacy, and conduct',
    body:
      'In-app calls are only for an active order; numbers stay masked. Follow the privacy policy. Do not place fake orders, harass customers or riders, or misuse the platform.',
  },
  {
    id: 'enforcement',
    title: 'Suspension and changes',
    body:
      'Tokajo may pause an outlet or suspend an account for policy or law violations. We may update these terms; important changes are communicated in the app.',
  },
];
