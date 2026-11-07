import { LEGAL_CONTACT_EMAIL, type LegalSection } from '@/lib/legal/urls';

export const SUPPORT_SECTIONS: LegalSection[] = [
  {
    heading: 'Contact',
    clauses: [
      {
        lead: 'Email.',
        text: `Write to ${LEGAL_CONTACT_EMAIL}. This is the support address for the TOKAJO Restaurant app.`,
      },
      {
        lead: 'Reply.',
        text: 'We reply on working days and aim to answer within 2 working days. Use a short subject such as Order, Payout, or Documents.',
      },
    ],
  },
  {
    heading: 'What to send',
    clauses: [
      {
        lead: 'Account.',
        text: 'Include the mobile number on the account, the outlet name, and the screen you were on.',
      },
      {
        lead: 'Order.',
        text: 'Add the order id and what happened, for example the kitchen could not accept, handover failed, or the food was returned.',
      },
      {
        lead: 'Payout.',
        text: 'Add the settlement date and the bank account name as it appears in the app. Do not send a card number, CVV, UPI PIN, or password.',
      },
    ],
  },
  {
    heading: 'Orders',
    clauses: [
      {
        lead: 'Missing order.',
        text: 'Confirm the outlet is approved and set to take orders, then refresh the kitchen list.',
      },
      {
        lead: 'Rider delay.',
        text: 'Keep the packed order ready and email the order id. Do not mark it handed over until the rider has it.',
      },
    ],
  },
  {
    heading: 'Documents and payouts',
    clauses: [
      {
        lead: 'Rejected document.',
        text: 'Upload a clear photo of the same document and wait for review. The outlet stays pending until it is approved.',
      },
      {
        lead: 'Missing settlement.',
        text: 'Payouts go only to a verified bank account or UPI ID. If one is missing after verification, email the outlet name and the date.',
      },
    ],
  },
  {
    heading: 'The account',
    clauses: [
      {
        lead: 'One-time code.',
        text: 'Check the mobile number, wait for the resend timer, and try again on a stable connection.',
      },
      {
        lead: 'Close account.',
        text: 'Finish or cancel open orders, then use Delete account in settings, or email us and ask us to close it.',
      },
    ],
  },
  {
    heading: 'Privacy requests',
    clauses: [
      {
        lead: 'Grievance.',
        text: `A request for a copy, a correction, or a complaint goes to ${LEGAL_CONTACT_EMAIL}. We aim to reply within 30 days.`,
      },
      {
        lead: 'Policy.',
        text: 'The privacy policy states what the restaurant app collects and what deletion removes.',
      },
    ],
  },
];
