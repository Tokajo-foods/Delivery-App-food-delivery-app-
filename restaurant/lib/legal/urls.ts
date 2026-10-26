import { API_BASE_URL } from '@/lib/api';

/** Public HTML pages on the API gateway. No login. */
export const LEGAL_URLS = {
  privacy: `${API_BASE_URL}/legal/privacy-policy`,
  terms: `${API_BASE_URL}/legal/terms`,
  support: `${API_BASE_URL}/legal/support`,
  deleteAccount: `${API_BASE_URL}/legal/delete-account`,
} as const;

export const LEGAL_CONTACT_EMAIL = 'support@tokajofoods.com';

export type LegalSection = {
  heading: string;
  body: string[];
};
