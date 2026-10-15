import { api } from '@/lib/api';

export type PartnerKycItem = {
  key: string;
  label: string;
  required: boolean;
  uploaded: boolean;
  verified: boolean;
  rejected: boolean;
  rejectReason: string | null;
  url: string | null;
  docStatus: string | null;
  ready: boolean;
};

export type PartnerKycChecklist = {
  partnerId: string;
  accountStatus: string;
  canGoOnline: boolean;
  canActivate: boolean;
  anyRejected: boolean;
  blockers: string[];
  rejectionSummary: string | null;
  items: PartnerKycItem[];
};

type Envelope<T> = { success?: boolean; data?: T };

export async function getPartnerKyc(): Promise<PartnerKycChecklist> {
  const res = await api.get<Envelope<PartnerKycChecklist>>(
    '/api/v1/delivery-service/partners/me/kyc'
  );
  const data = res.data?.data;
  if (!data) {
    return {
      partnerId: '',
      accountStatus: 'pending',
      canGoOnline: false,
      canActivate: false,
      anyRejected: false,
      blockers: [],
      rejectionSummary: null,
      items: [],
    };
  }
  return data;
}
