import type { LegalSection } from '@/lib/legal/urls';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal/urls';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Who we are',
    body: [
      'TOKAJO FOODS operates a food ordering and delivery platform in India. This policy explains how the TOKAJO Restaurant app handles information for outlet owners and their staff.',
      'The same platform also serves customers and delivery partners. We do not sell personal information, and we do not use it for third-party advertising.',
    ],
  },
  {
    heading: 'Account and outlet',
    body: [
      'When you create an account we collect your name, mobile number, and email so we can sign you in, send a one-time code, and reach you about the outlet.',
      'For the outlet we store the name, address, map pin, cuisine, hours, phone, and the menu you publish, including item names, prices, photos, and veg or non-veg marks.',
    ],
  },
  {
    heading: 'Orders and kitchen activity',
    body: [
      'We store orders placed at your outlet: items, amounts, status, preparation updates, handover, and a return to the restaurant when a drop cannot be completed.',
      'We also keep menu changes, reviews, support tickets, and order messages so the kitchen, the customer, and support can follow the same order.',
    ],
  },
  {
    heading: 'Location',
    body: [
      'The outlet pin is used so customers can see which kitchens can deliver and so a rider can reach pickup.',
      'A delivery partner’s live location is shared only while that partner is online or on an active trip, and it stops when they go offline and the trip has ended. Customer location is used to check whether your outlet can deliver to that address.',
    ],
  },
  {
    heading: 'Documents and photos',
    body: [
      'You may be asked for identity and business documents, such as FSSAI, GST, PAN, bank proof, and photos of the outlet or menu. We use them to review the listing before it can go live.',
      'Photos you upload are shown to customers with your menu. Upload only images you have the right to use.',
    ],
  },
  {
    heading: 'Payments and bank details',
    body: [
      'Customer card and UPI details are handled by our payment partner. We keep the payment reference, amount, and status. We do not store the full card number, CVV, or UPI PIN.',
      'A bank account or UPI ID you add is used only to settle payouts. It stays unverified until our team checks it, and payouts are not sent to an unverified account.',
    ],
  },
  {
    heading: 'Calls, devices, and notifications',
    body: [
      'The microphone is used for in-app calls about an order. Phone numbers stay masked. In-app internet calls are not recorded. A masked phone call placed through our telephony partner may be recorded for safety and disputes, and those recordings are deleted after 90 days.',
      'We store a push token, device model, operating system, and app version so we can send order alerts and keep the session secure.',
    ],
  },
  {
    heading: 'Who we share information with',
    body: [
      'On an order, the customer sees your outlet name, menu, and order status. The assigned rider sees the pickup address and the items to collect. Customer phone numbers stay masked.',
      'Service providers process data only to run their part of the service: Google Firebase for one-time codes and notifications, Google Maps, our payment partner for payments and payouts, LiveKit for in-app calls, our telephony partner, and our cloud hosts.',
      'We also share information when the law, a court, or a safety investigation requires it.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'We keep account and outlet information while the account is active. After you delete the account we remove or anonymise personal information within 30 days.',
      'Orders, invoices, tax records, and payout records may be kept for up to 8 years where Indian law requires it. An open dispute is kept until it is closed.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'You can update your profile and outlet details in the app. You can turn off location, camera, microphone, and notification permissions in the phone settings. Orders, calls, and alerts need the matching permission.',
      'The owner can delete the account from the account settings after open orders are finished or cancelled. You can also email us and ask for a copy, a correction, or deletion.',
      `Write to ${LEGAL_CONTACT_EMAIL}. We aim to reply to a privacy request within 30 days.`,
    ],
  },
  {
    heading: 'Children',
    body: [
      'The restaurant app is for outlet owners and staff who are 18 or older. We do not knowingly collect information from children.',
    ],
  },
];
