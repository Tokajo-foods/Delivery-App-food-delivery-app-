import { LEGAL_CONTACT_EMAIL, type LegalSection } from '@/lib/legal/urls';

export const SUPPORT_SECTIONS: LegalSection[] = [
  {
    heading: 'How to reach us',
    body: [
      `Email ${LEGAL_CONTACT_EMAIL}. This is the support address for the TOKAJO Restaurant app.`,
      'We reply on working days and aim to answer within 2 working days. Add a clear subject, such as “Order”, “Payout”, or “Documents”, so the right person can pick it up.',
    ],
  },
  {
    heading: 'What to include',
    body: [
      'The mobile number on the restaurant account, the outlet name, and which screen you were on.',
      'For an order, add the order id and what happened, for example the kitchen could not accept, handover failed, or the food was returned.',
      'For a payout, add the settlement date and the bank account name as it appears in the app. Do not send your full card number, CVV, UPI PIN, or password.',
    ],
  },
  {
    heading: 'Orders and the kitchen',
    body: [
      'If a new order does not appear, check that the outlet is approved and set to take orders, then pull to refresh the kitchen list.',
      'If a rider has not arrived for pickup, keep the packed order ready and write to us with the order id. Do not mark the order handed over until the rider has it.',
    ],
  },
  {
    heading: 'Documents and payouts',
    body: [
      'If a document is rejected, open the message in the app, upload a clear photo of the same document, and wait for review. The outlet stays pending until it is approved.',
      'Payouts go only to a verified bank account or UPI ID. If a settlement is missing after the account is verified, email us with the outlet name and the date.',
    ],
  },
  {
    heading: 'Account help',
    body: [
      'If you cannot receive the one-time code, check the mobile number, wait for the resend timer, and try again on a stable connection.',
      'To close the owner account, finish or cancel open orders first, then use Delete account in your account settings. You can also email us and ask us to close it.',
    ],
  },
  {
    heading: 'Privacy requests',
    body: [
      `Questions about your information, a correction, or a complaint go to ${LEGAL_CONTACT_EMAIL}. We aim to reply within 30 days.`,
      'The privacy policy describes what the restaurant app collects and what account deletion removes.',
    ],
  },
];
