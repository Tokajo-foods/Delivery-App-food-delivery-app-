/** Must match delivery-service `RIDER_POLICY.VERSION`. Bump both when the text changes. */
export const RIDER_POLICY_VERSION = '2026-10-15';

export const RIDER_POLICY_TITLE = 'Rider / Delivery Partner Onboarding Policy';

export type RiderPolicySection = {
  title: string;
  body: string[];
};

export const RIDER_POLICY_SECTIONS: RiderPolicySection[] = [
  {
    title: 'Rider Eligibility',
    body: [
      'Meet the prescribed minimum age requirement.',
      'Provide a valid government ID and accurate contact details.',
      'Hold a valid driving licence and relevant vehicle documents when delivering by motor vehicle.',
      'Complete the verification and training required by Tokajo.',
      'Accept the Tokajo Partner Agreement and Terms.',
    ],
  },
  {
    title: 'Rider Onboarding Documents',
    body: [
      'Aadhaar or other government ID, PAN card, driving licence, vehicle RC, valid vehicle insurance, bank account details, profile photograph, emergency contact, and other applicable documents.',
      'Tokajo requests information only as required for business needs and uses personal data in line with applicable privacy requirements and defined business purposes.',
    ],
  },
  {
    title: 'Rider Code of Conduct',
    body: [
      'Treat customers and restaurant staff with respect.',
      'Keep the order secure. Do not intentionally open or tamper with the package.',
      'Do not misuse or share customer information without authorisation.',
      'Do not use abusive language, threats, harassment, discrimination, or other inappropriate behaviour.',
      'Do not make deliveries while under the influence of intoxicants.',
      'Follow traffic and road safety rules.',
      'Do not engage in fake deliveries, false cancellations, fraud, or unauthorised payment collection.',
    ],
  },
  {
    title: 'Delivery Procedure',
    body: [
      'At the restaurant: verify the Order ID, collect the correct order, check the package’s external condition, and place it in a secure delivery bag.',
      'Update the pickup status in the app at the right time.',
      'At the customer: verify the order and customer details, hand over the order, complete the applicable payment process, and update the delivery status.',
    ],
  },
  {
    title: 'Rider Attendance & Availability',
    body: [
      'Work according to your scheduled shifts or assigned availability, and log in on time.',
      'Accept orders responsibly. Do not repeatedly cancel accepted orders without a valid reason.',
      'Maintain regular attendance and inform your manager or supervisor in advance if you cannot attend an assigned shift.',
      'A performance review may be conducted for repeated cancellations without a valid reason or consistent absence. Appropriate action may follow under company policy.',
    ],
  },
  {
    title: 'Rider Earnings & Incentives',
    body: [
      'Earnings may include per-order delivery earnings, distance-based earnings, peak-hour incentives, campaign incentives, referral incentives, or other approved incentives.',
      'Amount, eligibility, and payout conditions for each incentive may be set out in a separate Incentive Plan or Partner Agreement.',
    ],
  },
  {
    title: 'Rider Expenses',
    body: [
      'Responsibility for fuel, vehicle maintenance, mobile/internet, parking, and other operating expenses is specified in the Partner Agreement.',
    ],
  },
  {
    title: 'Customer Privacy',
    body: [
      'Use the customer’s phone number, address, order details, or other personal information only for delivery or service purposes.',
      'Do not use, store, or share customer information for personal or unauthorised purposes after the delivery is completed.',
    ],
  },
  {
    title: 'Fraud & Misconduct',
    body: [
      'Fake orders or deliveries, theft, order tampering, account sharing, fake documents, location/GPS manipulation, customer or restaurant fraud, harassment, or misuse of company systems may be serious violations.',
      'In serious cases Tokajo may apply temporary suspension, investigation, and termination/deactivation under the applicable agreement or law.',
    ],
  },
  {
    title: 'Restaurant & Rider Handover',
    body: [
      'The restaurant verifies the order ID, checks the items, seals the package, and hands it to the rider.',
      'The rider verifies the order ID, checks the package’s external condition, and takes it for delivery.',
    ],
  },
  {
    title: 'Rider Safety',
    body: [
      'Wear a helmet and the necessary safety equipment.',
      'Follow traffic rules. Avoid dangerous or rash driving.',
      'Do not use a mobile phone while driving.',
      'Report any accident or serious safety incident to Tokajo support as soon as possible.',
    ],
  },
  {
    title: 'Food Safety',
    body: [
      'Restaurants must comply with applicable food safety requirements, hygiene standards, and necessary licences/registrations. Tokajo may request compliance documents and corrective actions as needed.',
    ],
  },
  {
    title: 'Confidential Information',
    body: [
      'Do not share customer data, business data, pricing arrangements, commission details, internal processes, login credentials, or technical information with unauthorised third parties.',
    ],
  },
  {
    title: 'Verification & Rejection',
    body: [
      'Additional documentation or verification may be required before onboarding.',
      'Incomplete, inaccurate, or misleading information may delay, reject, suspend, or terminate onboarding under the applicable terms.',
    ],
  },
  {
    title: 'Rider Deactivation',
    body: [
      'A rider account may be deactivated if verification documents cannot be validated, the account is operated by another person, repeated or serious platform violations occur, fraudulent or deceptive activity is identified, serious misconduct occurs, significant safety/legal/operational risk is created, or required compliance steps are not completed within the applicable period.',
    ],
  },
];

export const RIDER_POLICY_DECLARATION =
  'I have read, understood and unconditionally accepted the terms and conditions of my letter of appointment and have agreed to keep its essence strictly private and confidential. I understand that providing this confidential information to anyone, including but not limited to any employee of the Company, would be a breach of my terms of engagement with the Company, and I shall be liable to termination without notice or remuneration. I hereby declare that the information I provide to the Company is complete, accurate and true in all respects.';

export const RIDER_POLICY_TERRITORY = 'India';

export const RIDER_POLICY_WELCOME =
  'Welcome to TOKAJO FOODS. By accepting this policy, you agree to the terms governing your participation as a Delivery Partner on the platform.';

export const RIDER_ELECTRONIC_ACCEPTANCE_HEADING = 'Electronic acceptance';

export const RIDER_ELECTRONIC_ACCEPTANCE_INTRO =
  'By selecting the acceptance checkbox and tapping Accept & Continue, you confirm that:';

export const RIDER_ELECTRONIC_ACCEPTANCE_POINTS = [
  'You have read and understood this Rider Onboarding Policy.',
  'You agree to the code of conduct, delivery procedure, and platform rules below.',
  'The information and documents you provide during registration are accurate.',
  'You have reviewed the Terms of Use and Privacy Policy.',
  'You consent to TOKAJO recording your electronic acceptance, including policy version and acceptance date and time on your partner profile.',
] as const;

export const RIDER_POLICY_CHECKBOX_LABEL =
  'I have read and agree to the Rider Onboarding Policy, Terms of Use, and Privacy Policy. TOKAJO records this acceptance on my delivery partner account.';

export const RIDER_POLICY_FOOTNOTE =
  'Your acceptance is stored on the delivery-service partner profile (version, timestamp, and device metadata).';

export function riderPolicyVersionLabel(version: string = RIDER_POLICY_VERSION): string {
  return `Version ${version} · ${RIDER_POLICY_TERRITORY}`;
}
