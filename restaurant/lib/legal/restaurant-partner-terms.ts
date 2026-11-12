/**
 * Restaurant Partner Agreement — acceptance popup and version tracking.
 * Full in-app legal screen: /legal/terms (TERMS_SECTIONS in terms-copy.ts).
 */
export const RESTAURANT_PARTNER_TERMS_VERSION = '2026-11-10';

export const RESTAURANT_PARTNER_AGREEMENT_TERRITORY = 'India';

/** Competent courts clause — update when legal entity jurisdiction is final. */
export const RESTAURANT_PARTNER_AGREEMENT_JURISDICTION =
  'competent courts at New Delhi, India';

export const RESTAURANT_PARTNER_AGREEMENT_WELCOME =
  'Welcome to TOKAJO FOODS. By registering your restaurant and accepting this Agreement, you agree to the terms governing your participation as a Restaurant Partner on TOKAJO FOODS.';

export const RESTAURANT_PARTNER_SUMMARY_HEADING = "What you're agreeing to";

export const RESTAURANT_PARTNER_SUMMARY_BULLETS = [
  'Outlet registration and verification',
  'Menu, orders and food safety',
  'Commission and payouts',
  'Delivery and customer complaints',
  'Privacy and account responsibilities',
  'Suspension and termination',
] as const;

export type PartnerTermsSection = {
  id: string;
  number: number;
  heading: string;
  body: string;
};

export const RESTAURANT_PARTNER_TERMS_SECTIONS: PartnerTermsSection[] = [
  {
    id: 'eligibility',
    number: 1,
    heading: 'Eligibility and Registration',
    body:
      'You must be at least 18 years old and be the restaurant owner or an authorised representative of the registered business. You agree to provide accurate personal, business, outlet and banking information during registration. You must have the legal authority and necessary permissions to operate your food business.',
  },
  {
    id: 'kyc',
    number: 2,
    heading: 'KYC and Outlet Approval',
    body:
      'You must submit valid documents, including FSSAI registration or licence, PAN, GST details where applicable, bank verification documents and other information requested by TOKAJO. All documents must be genuine, valid and up to date. Your outlet will remain under verification until TOKAJO completes its approval process. Registration or document submission does not guarantee approval or authorise your outlet to receive orders.',
  },
  {
    id: 'listing',
    number: 3,
    heading: 'Outlet Listing, Menu and Pricing',
    body:
      "You are responsible for maintaining accurate outlet information, operating hours, menu descriptions, prices, photographs, item availability and vegetarian or non-vegetarian classifications. Food items must match their displayed descriptions and prices. You must update unavailable items promptly and ensure that all photographs and content uploaded by you are authorised for use. TOKAJO may modify or remove misleading, inaccurate or prohibited listing content.",
  },
  {
    id: 'orders',
    number: 4,
    heading: 'Orders and Preparation',
    body:
      "You must monitor incoming orders and accept only those you can fulfil. Accepted orders must be prepared accurately and within the communicated preparation time. You must update order statuses correctly and ensure that every order contains the correct items and quantities. Repeated delays, incorrect orders, avoidable cancellations or failure to fulfil accepted orders may affect your outlet's availability or account status. Customer cancellations will be governed by the applicable cancellation policy and consumer protection laws.",
  },
  {
    id: 'food-safety',
    number: 5,
    heading: 'Food Safety and Hygiene',
    body:
      'You are solely responsible for the preparation, quality, quantity, ingredients, hygiene, packaging and safety of food supplied by your outlet. You must maintain valid FSSAI registration or licensing, as applicable, and comply with food safety laws, hygiene standards, storage requirements and other applicable regulations. Food must be fresh, properly prepared, safely stored and securely packed. You must accurately disclose applicable dietary and allergen information and immediately inform TOKAJO of any food safety incident or licence suspension affecting your operations.',
  },
  {
    id: 'delivery',
    number: 6,
    heading: 'Pickup, Delivery and Returns',
    body:
      'You must hand over correctly prepared and securely packed orders to the authorised Delivery Partner after verifying the pickup code or in-app confirmation. Where you use your own delivery fleet, you are responsible for the conduct and operations of your delivery personnel. For Return to Origin (RTO) orders, you must confirm receipt only after the delivery person has physically returned the food to your outlet. Returned food must be handled in accordance with applicable food safety requirements and must not be resold if its safety cannot be established.',
  },
  {
    id: 'fees',
    number: 7,
    heading: 'Commission, Fees and Settlements',
    body:
      'Applicable commission, platform fees, payment processing charges, promotional charges and taxes will be disclosed through the Restaurant Partner Application or a separate Commercial Schedule. You agree to the applicable commercial terms before they become effective. Eligible payouts will be transferred to your verified bank account according to the communicated settlement cycle. TOKAJO may make authorised adjustments for commissions, refunds, cancellations, chargebacks, taxes and other agreed charges. Settlement discrepancies may be raised through the designated partner support channel.',
  },
  {
    id: 'refunds',
    number: 8,
    heading: 'Refunds, Cancellations and Customer Complaints',
    body:
      "TOKAJO may investigate complaints relating to missing items, incorrect orders, food quality, damaged packaging, delays or other order-related issues. You must cooperate with investigations and provide relevant information when requested. Refunds, replacements or other customer remedies will be handled according to applicable law and TOKAJO's disclosed customer policies. Where a complaint or cancellation is attributable to your outlet, the corresponding adjustment may be made to your settlement in accordance with the applicable policy. You may dispute an adjustment through the designated grievance process.",
  },
  {
    id: 'privacy',
    number: 9,
    heading: 'Privacy, Calls and Account Security',
    body:
      'You must keep your account credentials and OTPs confidential and ensure that only authorised staff access your account. Customer information received through TOKAJO may only be used for fulfilling orders and related customer support. You must not sell, disclose, misuse or use customer information for unauthorised marketing. In-app and masked calls must be used only for legitimate platform-related purposes. Calls may be recorded where legally permitted and after required notice. Information and recordings will be handled according to applicable privacy and retention policies. Both parties must comply with applicable data protection laws and the TOKAJO Privacy Policy.',
  },
  {
    id: 'conduct',
    number: 10,
    heading: 'Platform Conduct and Responsibilities',
    body:
      "You must not create fake orders, manipulate transactions, misuse customer information, upload fraudulent documents, mislead customers, manipulate reviews, harass customers or delivery personnel, or misuse TOKAJO's technology or brand. You are responsible for your outlet's employees, food preparation, statutory registrations, business taxes and applicable legal obligations. TOKAJO provides a technology platform connecting customers and restaurants. Unless separately agreed, TOKAJO does not prepare or manufacture food and does not guarantee any minimum order volume, revenue or business performance.",
  },
  {
    id: 'termination',
    number: 11,
    heading: 'Suspension and Termination',
    body:
      'TOKAJO may restrict, temporarily suspend or deactivate an outlet or account for fraudulent activity, repeated operational violations, invalid documents, food safety concerns, misuse of customer information, legal non-compliance or material breach of this Agreement. Where reasonably practicable, TOKAJO will communicate the reason and any corrective action required. Immediate restrictions may be imposed where necessary for safety, security or legal compliance. You may request account closure through the prescribed process. Before closure, accepted orders must be resolved. Eligible pending payouts and outstanding obligations will be handled according to applicable settlement terms and law.',
  },
  {
    id: 'general',
    number: 12,
    heading: 'General Terms and Legal Matters',
    body:
      'This Agreement, together with the applicable Commercial Schedule, Privacy Policy and incorporated platform policies, governs your participation as a Restaurant Partner. TOKAJO may update these terms and will communicate material changes through the application or registered contact details. Fresh acceptance will be obtained wherever required. Both parties shall act in accordance with applicable Indian laws, including consumer protection and digital personal data protection requirements as applicable. Disputes should first be raised through the designated grievance channel and attempted to be resolved amicably. If unresolved, either party may pursue appropriate legal remedies before the ' +
      RESTAURANT_PARTNER_AGREEMENT_JURISDICTION +
      ', subject to applicable law. Nothing in this Agreement limits statutory rights or remedies that cannot legally be excluded.',
  },
];

/** Additional blocks shown after the 12 numbered sections (same text in popup and Legal screen). */
export const RESTAURANT_PARTNER_APPENDIX_SECTIONS: PartnerTermsSection[] = [
  {
    id: 'commercial',
    number: 13,
    heading: 'Commercial Schedule',
    body:
      'Commission, platform fees, payment charges, and promotional terms applicable to your outlet are disclosed in the Restaurant Partner Application under Finance (payouts and settlement details) and when you accept a platform offer. The Commercial Schedule forms part of this Agreement for your outlet. TOKAJO may update commercial terms with notice in the app; continued use after the effective date constitutes acceptance where permitted by law.',
  },
  {
    id: 'grievance',
    number: 14,
    heading: 'Grievance and partner support',
    body:
      'Raise order, settlement, or conduct concerns through in-app Support or by email to the partner grievance desk. TOKAJO will acknowledge partner grievances and aim to respond within thirty (30) days, subject to complexity and applicable law. For data-protection queries, contact details are in the Privacy Policy.',
  },
  {
    id: 'indemnity',
    number: 15,
    heading: 'Indemnity',
    body:
      'You agree to indemnify and hold harmless TOKAJO and its affiliates from claims, losses, and reasonable costs arising from your breach of this Agreement, applicable law, food supplied by your outlet, fraudulent or misleading listings, misuse of customer data, or acts of your staff or fleet riders where you are responsible for them.',
  },
  {
    id: 'liability',
    number: 16,
    heading: 'Limitation of liability',
    body:
      'To the fullest extent permitted by law, TOKAJO is not liable for indirect or consequential loss, or for loss of profit or goodwill. TOKAJO’s aggregate liability arising from this Agreement is limited to the platform fees paid by or retained in respect of your outlet in the three (3) months before the event giving rise to the claim, except where liability cannot be limited under applicable law (including death or personal injury caused by negligence, or fraud).',
  },
  {
    id: 'staff',
    number: 17,
    heading: 'Staff and authorised users',
    body:
      'You are responsible for ensuring that every person you invite to access your outlet in the app (staff, managers, cashiers) follows this Agreement and platform policies. Acceptance by the owner or authorised representative binds the business for actions taken through linked accounts.',
  },
];

export const TOKAJO_LEGAL_ENTITY = {
  tradeName: 'TOKAJO FOODS',
  legalName: 'Tokajo Foods Private Limited',
  registeredOffice:
    'Registered office address as published on tokajofoods.com and updated from time to time.',
  grievanceLabel: 'Partner Grievance Desk',
  grievanceEmail: 'support@tokajofoods.com',
  supportChannel: 'In-app Support (Restaurant Partner Application)',
} as const;

export const PARTNER_AGREEMENT_EFFECTIVE_NOTE =
  'Effective date for your acceptance is the date and time you tap Accept & Continue; TOKAJO stores the agreement version with that timestamp on your partner account.';

export const ELECTRONIC_ACCEPTANCE_HEADING = 'Electronic acceptance';

export const ELECTRONIC_ACCEPTANCE_INTRO =
  'By selecting the acceptance checkbox and tapping Accept & Continue, you confirm that:';

export const ELECTRONIC_ACCEPTANCE_POINTS = [
  'You have read and understood this Agreement.',
  'You agree to comply with these terms and applicable platform policies.',
  'You are at least 18 years old and authorised to accept these terms.',
  'The information and documents provided during registration are accurate.',
  'You have reviewed the Privacy Policy and applicable Commercial Terms.',
  'You understand that your outlet must be approved before receiving orders.',
  'You consent to TOKAJO recording your electronic acceptance, including the agreement version and acceptance date and time.',
] as const;

export const PARTNER_AGREEMENT_CHECKBOX_LABEL =
  'I have read and agree to the Partner Agreement and Privacy Policy. I confirm I am 18 or older and authorised to accept these terms. TOKAJO records this acceptance on my account.';

export const PARTNER_AGREEMENT_FOOTNOTE =
  'Your acceptance will be securely recorded against your Restaurant Partner account.';

export const PARTNER_AGREEMENT_SCROLL_HINT =
  'Scroll to the end to accept. You can read this agreement anytime under Account → Legal documents → Partner Agreement.';

/** Shown on the acceptance sheet — partner's calendar day in IST. */
export function formatPartnerAgreementDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function partnerAgreementVersionLabel(): string {
  return `Version ${RESTAURANT_PARTNER_TERMS_VERSION} · ${RESTAURANT_PARTNER_AGREEMENT_TERRITORY}`;
}

/** @deprecated Flat list for legacy imports. */
export type PartnerTermsPoint = { id: string; title: string; body: string };

export const RESTAURANT_PARTNER_TERMS_POINTS: PartnerTermsPoint[] = [
  ...RESTAURANT_PARTNER_TERMS_SECTIONS,
  ...RESTAURANT_PARTNER_APPENDIX_SECTIONS,
].map((s) => ({
  id: s.id,
  title: s.heading,
  body: s.body,
}));

export const RESTAURANT_PARTNER_ALL_SECTIONS: PartnerTermsSection[] = [
  ...RESTAURANT_PARTNER_TERMS_SECTIONS,
  ...RESTAURANT_PARTNER_APPENDIX_SECTIONS,
];
