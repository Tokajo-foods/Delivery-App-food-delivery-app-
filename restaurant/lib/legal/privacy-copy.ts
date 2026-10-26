import type { LegalSection } from '@/lib/legal/urls';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Who we are',
    body: [
      'TOKAJO FOODS runs a food ordering and delivery platform in India. This policy covers the customer app, the TOKAJO Restaurant app, and the TOKAJO Delivery app.',
      'We do not sell your personal data, and we do not use it for third-party advertising.',
    ],
  },
  {
    heading: 'Account data',
    body: [
      'We collect your name, mobile number, email, and an optional profile photo to create your account, sign you in with a one-time password, and contact you about orders.',
    ],
  },
  {
    heading: 'Location',
    body: [
      'Restaurant partners share the outlet pin so customers can find the store and riders can reach pickup.',
      'Delivery partners share precise location, including in the background, only while they are online or on an active trip. Sharing stops when they go offline and the trip has ended.',
      'Customer location is read while the customer app is in use, to check which restaurants can deliver.',
    ],
  },
  {
    heading: 'Photos and documents',
    body: [
      'Restaurant and delivery partners upload identity and business documents (such as FSSAI, GST, PAN, bank proof, licence, and vehicle papers) and photos so we can verify the account.',
      'Menu, outlet, and profile photos are used to show the restaurant to customers.',
    ],
  },
  {
    heading: 'Microphone and calls',
    body: [
      'The microphone is used for in-app voice calls about an order. Your mobile number stays hidden. In-app internet calls are not recorded.',
      'Masked phone calls placed through our telephony partner may be recorded for safety and disputes. Those recordings are deleted after 90 days.',
    ],
  },
  {
    heading: 'Orders, payments, and devices',
    body: [
      'We store orders, menu changes, reviews, support tickets, and order chat so we can run the service and resolve complaints.',
      'Customer card and UPI details are handled by our payment partner. We keep the payment reference, amount, and status, not the full card number, CVV, or UPI PIN.',
      'Restaurant and delivery partners add a bank account or UPI ID so we can pay settlements.',
      'We store a push token, device model, OS version, and app version to send order alerts and keep sessions secure.',
    ],
  },
  {
    heading: 'Who we share data with',
    body: [
      'On an order, the restaurant sees the customer name and items. The delivery partner sees the name, address, and drop pin for that trip. Phone numbers stay masked.',
      'Service providers process data only to provide their service: Google Firebase (OTP and push), Google Maps, Razorpay (payments and payouts), LiveKit (in-app calls), our telephony partner, and our cloud hosts.',
      'We also share data when the law, a court, or a safety investigation requires it.',
    ],
  },
  {
    heading: 'How long we keep it',
    body: [
      'We keep data while the account is active. After you delete the account we remove or anonymise personal data within 30 days.',
      'Order, invoice, tax, and payout records may be kept for up to 8 years where Indian law requires it. Open disputes are kept until they are closed.',
    ],
  },
  {
    heading: 'Your choices',
    body: [
      'You can edit your profile in the app, and you can turn location, microphone, camera, and notification permissions off in phone settings. Delivery, calling, and order alerts need the matching permission.',
      'Restaurant owners delete the account from Admin → Your account → Delete account. You can also email us, as described on the public delete-account page.',
      'To ask for a copy or correction, or to complain, write to our grievance officer at the address on the public privacy page. We aim to reply within 30 days.',
    ],
  },
  {
    heading: 'Children',
    body: [
      'The apps are not for anyone under 18. We do not knowingly collect data from children.',
    ],
  },
];
