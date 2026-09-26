export type UploadFile = { uri: string; fileName: string; mimeType: string };

export function docStatusMeta(status?: string) {
  if (status === 'verified') {
    return { label: 'Verified', color: '#15803D', bg: '#DCFCE7' };
  }
  if (status === 'rejected') {
    return { label: 'Rejected', color: '#B91C1C', bg: '#FEE2E2' };
  }
  if (status === 'uploaded') {
    return { label: 'Under review', color: '#B45309', bg: '#FEF3C7' };
  }
  return { label: 'Not uploaded', color: '#64748B', bg: '#F1F5F9' };
}

export function canReuploadDoc(status?: string) {
  return status !== 'verified';
}

export const KYC_DOC_LABELS: Record<string, string> = {
  fssai: 'FSSAI license',
  gst: 'GST certificate',
  pan: 'PAN card',
  idProof: 'ID proof',
  cancelledCheque: 'Cancelled cheque',
  outletPhoto: 'Outlet photo',
  bank: 'Bank account',
};
