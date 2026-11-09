import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { unwrapData } from '@/lib/auth/auth-normalize';
import { RESTAURANT_PARTNER_TERMS_VERSION } from '@/lib/legal/restaurant-partner-terms';

const BASE = '/api/v1/user-service/users/me/restaurant-partner-terms';

export type RestaurantPartnerTermsStatus = {
  required: boolean;
  currentVersion: string;
  accepted: boolean;
  acceptedVersion: string | null;
  acceptedAt: string | null;
  termsUrl: string;
  privacyUrl: string;
};

function mapStatus(raw: Record<string, unknown>): RestaurantPartnerTermsStatus {
  return {
    required: Boolean(raw.required),
    currentVersion: String(raw.currentVersion ?? RESTAURANT_PARTNER_TERMS_VERSION),
    accepted: Boolean(raw.accepted),
    acceptedVersion: raw.acceptedVersion ? String(raw.acceptedVersion) : null,
    acceptedAt: raw.acceptedAt ? String(raw.acceptedAt) : null,
    termsUrl: String(raw.termsUrl ?? 'https://tokajofoods.com/terms'),
    privacyUrl: String(raw.privacyUrl ?? 'https://tokajofoods.com/privacy'),
  };
}

export const partnerTermsApi = {
  async getStatus(): Promise<RestaurantPartnerTermsStatus> {
    const { data } = await api.get<unknown>(BASE);
    return mapStatus(unwrapData(data));
  },

  async accept(): Promise<RestaurantPartnerTermsStatus> {
    const source =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
    const { data } = await api.post<unknown>(`${BASE}/accept`, {
      version: RESTAURANT_PARTNER_TERMS_VERSION,
      accepted: true,
      source,
    });
    return mapStatus(unwrapData(data));
  },
};
