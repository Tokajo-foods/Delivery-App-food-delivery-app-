import type { LegalSection } from '@/lib/legal/urls';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Agreement',
    clauses: [
      {
        lead: 'Scope.',
        text: 'These terms apply when you use the TOKAJO Restaurant app to list an outlet, receive orders, and hand food to a rider on TOKAJO FOODS in India.',
      },
      {
        lead: 'Acceptance.',
        text: 'You must accept these terms in the app before using TOKAJO Restaurant; we store the version and time on your account. You must be 18 or older and use your own name and mobile number.',
      },
    ],
  },
  {
    heading: 'The account',
    clauses: [
      {
        lead: 'Access.',
        text: 'Keep your password and one-time codes private. You are responsible for staff you add and for what they do in the app.',
      },
      {
        lead: 'Outlet details.',
        text: 'The name, address pin, phone, cuisine, hours, and menu must describe the kitchen that will prepare the food. Upload the documents we ask for, including FSSAI and bank proof.',
      },
      {
        lead: 'Approval.',
        text: 'Sending documents does not make the outlet live. The listing stays pending, and cannot take new orders, until our team approves it.',
      },
    ],
  },
  {
    heading: 'Menu and orders',
    clauses: [
      {
        lead: 'Accuracy.',
        text: 'Prices, photos, and veg or non-veg marks must be accurate. Mark an item unavailable when the kitchen cannot make it.',
      },
      {
        lead: 'Acceptance.',
        text: 'Accept an order only when you can prepare it. Mark it ready when it is packed. A customer can cancel only before the kitchen accepts.',
      },
      {
        lead: 'Availability.',
        text: 'Online, offline, and pause only control new orders. They do not approve the listing.',
      },
    ],
  },
  {
    heading: 'Handover and returns',
    clauses: [
      {
        lead: 'Pickup.',
        text: 'Confirm handover with the pickup code, or the in-app confirmation, when the packed order leaves the kitchen.',
      },
      {
        lead: 'Return.',
        text: 'If a drop cannot be completed, confirm the return only after the rider has arrived and the food is back at the outlet.',
      },
      {
        lead: 'Riders.',
        text: 'You are responsible for riders on your own fleet. Platform riders follow the trip shown in their app.',
      },
    ],
  },
  {
    heading: 'Fees and payouts',
    clauses: [
      {
        lead: 'Customer payment.',
        text: 'Payments are processed by our payment partner. We do not see the full card number, CVV, or UPI PIN.',
      },
      {
        lead: 'Settlement.',
        text: 'Commission and fees shown in the app apply to settled orders. Payouts are not sent to an unverified bank account.',
      },
      {
        lead: 'Tax.',
        text: 'You are responsible for the taxes that apply to the outlet, and for the invoices the law requires you to keep.',
      },
    ],
  },
  {
    heading: 'Calls and content',
    clauses: [
      {
        lead: 'Calls.',
        text: 'In-app calls are only for an active order. Numbers stay hidden. A masked phone call may be recorded for safety and deleted after 90 days.',
      },
      {
        lead: 'Content.',
        text: 'Photos and menu text must be yours to share and must not mislead a customer.',
      },
    ],
  },
  {
    heading: 'Suspension',
    clauses: [
      {
        lead: 'Misuse.',
        text: 'Do not place fake orders, scrape the service, misuse another person’s account, or harass a customer, rider, or staff member.',
      },
      {
        lead: 'Action.',
        text: 'We may refuse an order, pause an outlet, or suspend an account if these terms or the law are broken, or to protect people using the platform.',
      },
    ],
  },
  {
    heading: 'Closing the account',
    clauses: [
      {
        lead: 'Deletion.',
        text: 'Finish or cancel open orders before you delete the account. A pending payout is paid after the bank account is verified and the settlement run completes.',
      },
      {
        lead: 'Law.',
        text: 'These terms are governed by the laws of India. If we change them, we update the date on this page and tell you in the app when the change is important.',
      },
    ],
  },
];
