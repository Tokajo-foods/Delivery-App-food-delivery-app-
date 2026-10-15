import { api } from '@/lib/api';
import { getApiErrorCode, getApiErrorMessage, PartnerApiError } from '@/lib/errors';

const POLICY_BASE = '/api/v1/delivery-service/partners/me/policy';

export type RiderPolicyStatus = {
  title: string;
  currentVersion: string;
  accepted: boolean;
  acceptedVersion: string | null;
  acceptedAt: string | null;
};

type Envelope<T> = { success?: boolean; message?: string; data?: T };

function toStatus(data: Partial<RiderPolicyStatus> | undefined): RiderPolicyStatus {
  return {
    title: data?.title ?? '',
    currentVersion: data?.currentVersion ?? '',
    accepted: data?.accepted === true,
    acceptedVersion: data?.acceptedVersion ?? null,
    acceptedAt: data?.acceptedAt ?? null,
  };
}

function rethrow(error: unknown, fallback: string): never {
  throw new PartnerApiError(
    getApiErrorMessage(error, fallback),
    getApiErrorCode(error)
  );
}

export const riderPolicyApi = {
  /** GET /partners/me/policy */
  getStatus: async (): Promise<RiderPolicyStatus> => {
    try {
      const res = await api.get<Envelope<RiderPolicyStatus>>(POLICY_BASE);
      return toStatus(res.data?.data);
    } catch (error) {
      rethrow(error, 'Could not load the rider policy.');
    }
  },

  /** POST /partners/me/policy/accept */
  accept: async (version: string): Promise<RiderPolicyStatus> => {
    try {
      const res = await api.post<Envelope<RiderPolicyStatus>>(
        `${POLICY_BASE}/accept`,
        { version, accepted: true }
      );
      return toStatus(res.data?.data);
    } catch (error) {
      rethrow(error, 'Could not save your acceptance. Please try again.');
    }
  },
};
