import type { LegalSection } from '@/lib/legal/urls';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Agreement',
    body: [
      'These terms apply to the TOKAJO FOODS customer app, the TOKAJO Restaurant app, and the TOKAJO Delivery app. Creating an account or continuing to use an app means you agree to these terms and the privacy policy.',
      'You must be 18 or older. Use your own name and mobile number, and keep your password and one-time passwords private.',
    ],
  },
  {
    heading: 'Restaurant partners',
    body: [
      'The outlet name, address pin, phone, cuisine, hours, and menu must match the kitchen. Upload the documents we ask for, including FSSAI and bank proof.',
      'Sending documents does not make the outlet live. Our team approves the listing. Until then the outlet stays pending and cannot go online for new orders.',
      'Online, offline, and pause only control whether you take new orders. They do not approve the listing.',
      'Accept an order only when you can cook it. Mark it ready when it is packed. Confirm rider handover, including a return if the bag comes back to the store.',
      'Prices, photos, and veg or non-veg marks must be accurate. Mark an item unavailable when you cannot make it.',
      'A bank account you save stays unverified until we check it. Payouts are not sent to an unverified account. Commission and fees shown in the app apply to settled orders.',
      'You are responsible for staff you add and for riders on your own fleet.',
    ],
  },
  {
    heading: 'Delivery partners',
    body: [
      'You cannot go on duty until document checks are complete, or while the account is suspended.',
      'Live location, including in the background, is shared only while you are online or on a trip, and stops when you go offline and the trip has ended.',
      'Hand over the correct order. Do not open the food or collect any payment the app does not show.',
    ],
  },
  {
    heading: 'Customers, payments, and calls',
    body: [
      'A customer can cancel only before the kitchen accepts the order. Online payments are processed by our payment partner. We never see the full card number, CVV, or UPI PIN.',
      'The microphone is only for in-app calls about an order. Phone numbers stay hidden. Masked phone calls may be recorded for safety and deleted after 90 days. In-app internet calls are not recorded.',
      'Photos you upload must be yours to share and must not mislead.',
    ],
  },
  {
    heading: 'Suspension and ending the account',
    body: [
      'We may refuse an order, pause an outlet, or suspend an account if these terms or the law are broken, or to protect users and the platform. Do not place fake orders, scrape the service, or harass anyone.',
      'You can delete your account in the app. Finish or cancel open orders first. A pending payout is paid after the bank account is verified and the settlement run completes.',
      'These terms are governed by the laws of India. We will update the date on the public terms page when they change, and tell you in the app when a change is important.',
    ],
  },
];
