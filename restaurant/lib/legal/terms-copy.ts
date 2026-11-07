import type { LegalSection } from '@/lib/legal/urls';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'The agreement',
    body: [
      'These terms apply when you use the TOKAJO Restaurant app to list an outlet, receive orders, and hand food to a rider on the TOKAJO FOODS platform in India.',
      'Creating an account, or continuing to use the app, means you agree to these terms and the privacy policy. You must be 18 or older and use your own name and mobile number.',
    ],
  },
  {
    heading: 'Your restaurant account',
    body: [
      'Keep your password and one-time codes private. You are responsible for staff you add to the outlet and for what they do in the app.',
      'The outlet name, address pin, phone, cuisine, hours, and menu must describe the kitchen that will prepare the food. Upload the documents we ask for, including FSSAI and bank proof.',
      'Sending documents does not make the outlet live. Our team approves the listing. Until then the outlet stays pending and cannot take new orders.',
    ],
  },
  {
    heading: 'Menu and orders',
    body: [
      'Prices, photos, and veg or non-veg marks must be accurate. Mark an item unavailable when the kitchen cannot make it.',
      'Accept an order only when you can prepare it. Move it through preparation, and mark it ready when it is packed for pickup. A customer can cancel only before the kitchen accepts the order.',
      'Going online, offline, or on pause only controls whether you take new orders. It does not approve the listing.',
    ],
  },
  {
    heading: 'Pickup, handover, and returns',
    body: [
      'Confirm handover to the rider with the pickup code, or the in-app confirmation, when the packed order leaves the kitchen.',
      'If a drop cannot be completed, the rider may bring the order back. Confirm the return only after the rider has arrived and the food is back at the outlet. A return is not a new customer delivery.',
      'You are responsible for riders on your own fleet. Platform riders follow the trip shown in their app.',
    ],
  },
  {
    heading: 'Payments, fees, and payouts',
    body: [
      'Customer payments are processed by our payment partner. We do not see the full card number, CVV, or UPI PIN.',
      'Commission and fees shown in the app apply to settled orders. A bank account you save stays unverified until we check it, and payouts are not sent to an unverified account.',
      'You are responsible for the taxes that apply to your outlet. Keep invoices and food-safety records as the law requires.',
    ],
  },
  {
    heading: 'Calls and content',
    body: [
      'In-app calls are only for an active order. Phone numbers stay hidden. Masked phone calls may be recorded for safety and deleted after 90 days. In-app internet calls are not recorded.',
      'Photos and menu text you upload must be yours to share and must not mislead a customer.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: [
      'Do not place fake orders, scrape the service, misuse another person’s account, or harass a customer, rider, or staff member.',
      'We may refuse an order, pause an outlet, or suspend an account if these terms or the law are broken, or to protect people using the platform.',
    ],
  },
  {
    heading: 'Closing the account',
    body: [
      'You can delete the owner account in the app. Finish or cancel open orders first. A pending payout is paid after the bank account is verified and the settlement run completes.',
      'These terms are governed by the laws of India. When we change them, we update the date on this page and tell you in the app if the change is important.',
    ],
  },
];
