const SITE = 'https://tokajofoods.com';

/** Public pages on the company website. Play Console lists the same URLs. */
export const LEGAL_URLS = {
  privacy: `${SITE}/privacy`,
  terms: `${SITE}/terms`,
  support: `${SITE}/contact`,
  deleteAccount: `${SITE}/delete-account`,
} as const;

export const LEGAL_CONTACT_EMAIL = 'support@tokajofoods.com';

export type LegalSection = {
  heading: string;
  body: string[];
};
