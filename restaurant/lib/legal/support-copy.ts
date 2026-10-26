import { LEGAL_CONTACT_EMAIL, type LegalSection } from '@/lib/legal/urls';

export const SUPPORT_SECTIONS: LegalSection[] = [
  {
    heading: 'Email',
    body: [
      `Write to ${LEGAL_CONTACT_EMAIL}. We aim to reply within 2 working days.`,
      'Include the mobile number on the account, which app you use (restaurant, delivery, or customer), and the order id or outlet name if you have one.',
    ],
  },
  {
    heading: 'Restaurant app',
    body: [
      'After you sign in, open Admin → Help & support and raise a ticket for an order, payout, or KYC question.',
      'To delete the owner account, open Admin → Your account → Delete account. Finish or cancel open orders first.',
    ],
  },
  {
    heading: 'Delivery and customer apps',
    body: [
      'Delivery partners open Support after sign-in. Go offline and finish the active trip before deleting the account from Profile.',
      'Customers use in-order help or support from Profile. Account deletion is under Profile → Delete account.',
    ],
  },
  {
    heading: 'Privacy complaints',
    body: [
      'Privacy questions go to the grievance officer at the same email. We aim to reply within 30 days. The public privacy policy and delete-account page describe what we collect and what deletion removes.',
    ],
  },
];
