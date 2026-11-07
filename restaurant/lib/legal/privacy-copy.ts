import type { LegalSection } from '@/lib/legal/urls';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal/urls';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Who we are',
    clauses: [
      {
        lead: 'Platform.',
        text: 'TOKAJO FOODS runs food ordering and delivery in India. This policy covers the TOKAJO Restaurant app used by outlet owners and staff.',
      },
      {
        lead: 'No sale.',
        text: 'We do not sell personal information, and we do not use it for third-party advertising.',
      },
    ],
  },
  {
    heading: 'Account and outlet',
    clauses: [
      {
        lead: 'Account.',
        text: 'We collect your name, mobile number, and email to sign you in, send a one-time code, and contact you about the outlet.',
      },
      {
        lead: 'Outlet.',
        text: 'We store the outlet name, address, map pin, cuisine, hours, phone, and the menu you publish, including prices, photos, and veg or non-veg marks.',
      },
    ],
  },
  {
    heading: 'Orders',
    clauses: [
      {
        lead: 'Kitchen record.',
        text: 'We store items, amounts, status, preparation updates, handover, and a return to the restaurant when a drop cannot be completed.',
      },
      {
        lead: 'Messages.',
        text: 'Menu changes, reviews, support tickets, and order messages are kept so the kitchen, the customer, and support follow the same order.',
      },
    ],
  },
  {
    heading: 'Location',
    clauses: [
      {
        lead: 'Outlet pin.',
        text: 'The pin shows customers which kitchens can deliver and helps a rider reach pickup.',
      },
      {
        lead: 'Live location.',
        text: 'A rider’s location is shared only while that rider is online or on a trip, and it stops when they go offline and the trip has ended.',
      },
    ],
  },
  {
    heading: 'Documents and photos',
    clauses: [
      {
        lead: 'Verification.',
        text: 'FSSAI, GST, PAN, bank proof, and outlet photos are used to review the listing before it can go live.',
      },
      {
        lead: 'Menu photos.',
        text: 'Images you upload are shown with the menu. Upload only images you have the right to use.',
      },
    ],
  },
  {
    heading: 'Payments',
    clauses: [
      {
        lead: 'Customer payment.',
        text: 'Card and UPI details are handled by our payment partner. We keep the reference, amount, and status, not the full card number, CVV, or UPI PIN.',
      },
      {
        lead: 'Payout account.',
        text: 'A bank account or UPI ID is used only to settle payouts. It stays unverified until it is checked, and payouts are not sent before that.',
      },
    ],
  },
  {
    heading: 'Calls and devices',
    clauses: [
      {
        lead: 'Calls.',
        text: 'The microphone is for in-app calls about an order. Numbers stay masked. In-app internet calls are not recorded. A masked phone call may be recorded for safety and deleted after 90 days.',
      },
      {
        lead: 'Device.',
        text: 'A push token, device model, operating system, and app version are stored for order alerts and a secure session.',
      },
    ],
  },
  {
    heading: 'Who receives information',
    clauses: [
      {
        lead: 'On an order.',
        text: 'The customer sees the outlet, menu, and status. The rider sees the pickup address and the items. Customer phone numbers stay masked.',
      },
      {
        lead: 'Providers.',
        text: 'Google Firebase, Google Maps, our payment partner, LiveKit, our telephony partner, and our cloud hosts process data only to run their part of the service.',
      },
      {
        lead: 'Law.',
        text: 'We share information when the law, a court, or a safety investigation requires it.',
      },
    ],
  },
  {
    heading: 'Retention',
    clauses: [
      {
        lead: 'Account.',
        text: 'Information is kept while the account is active. After deletion, personal information is removed or anonymised within 30 days.',
      },
      {
        lead: 'Records.',
        text: 'Orders, invoices, tax records, and payouts may be kept for up to 8 years where Indian law requires it. An open dispute is kept until it is closed.',
      },
    ],
  },
  {
    heading: 'Your choices',
    clauses: [
      {
        lead: 'Controls.',
        text: 'You can update the profile and outlet in the app, and you can turn permissions off in the phone settings. Orders, calls, and alerts need the matching permission.',
      },
      {
        lead: 'Requests.',
        text: `The owner can delete the account after open orders are finished or cancelled. For a copy, a correction, or a complaint, write to ${LEGAL_CONTACT_EMAIL}. We aim to reply within 30 days.`,
      },
    ],
  },
  {
    heading: 'Children',
    clauses: [
      {
        lead: 'Age.',
        text: 'The restaurant app is for owners and staff who are 18 or older. We do not knowingly collect information from children.',
      },
    ],
  },
];
