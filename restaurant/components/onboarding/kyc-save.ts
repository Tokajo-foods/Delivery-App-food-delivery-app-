import { Alert } from 'react-native';

import type { UploadFile } from '@/components/onboarding/kyc-doc-meta';
import { getApiErrorMessage } from '@/lib/errors';
import {
  FSSAI_RE,
  GSTIN_RE,
  IFSC_RE,
  PAN_RE,
} from '@/lib/restaurant/onboarding-types';

type UploadPayload = Record<string, unknown>;

export async function saveKycLicense(opts: {
  kind: 'fssai' | 'gst' | 'pan' | 'idProof';
  fssaiNo: string;
  gstin: string;
  panNo: string;
  idProofType: string;
  file: UploadFile | null;
  runUpload: (payload: UploadPayload) => Promise<void>;
}) {
  const { kind, file, runUpload } = opts;
  if (kind === 'fssai') {
    if (opts.fssaiNo && !FSSAI_RE.test(opts.fssaiNo)) {
      Alert.alert('Invalid FSSAI', 'FSSAI license must be 14 digits.');
      return;
    }
    await runUpload({
      fssaiLicense: opts.fssaiNo || undefined,
      fssai: file ?? undefined,
    });
    return;
  }
  if (kind === 'gst') {
    const value = opts.gstin.trim().toUpperCase();
    if (value && !GSTIN_RE.test(value)) {
      Alert.alert('Invalid GSTIN', 'Enter a valid 15-character GSTIN.');
      return;
    }
    await runUpload({ gstin: value || undefined, gst: file ?? undefined });
    return;
  }
  if (kind === 'idProof') {
    await runUpload({
      idProofType: opts.idProofType,
      idProof: file ?? undefined,
    });
    return;
  }
  const value = opts.panNo.trim().toUpperCase();
  if (value && !PAN_RE.test(value)) {
    Alert.alert('Invalid PAN', 'Enter a valid 10-character PAN.');
    return;
  }
  await runUpload({ panNumber: value || undefined, pan: file ?? undefined });
}

export async function saveKycBank(opts: {
  ifsc: string;
  accountNo: string;
  holderName: string;
  file: UploadFile | null;
  updateBank: (body: {
    accountNo: string;
    ifsc: string;
    holderName: string;
  }) => Promise<unknown>;
  uploadCheque: (file: UploadFile) => Promise<unknown>;
  clearFile: () => void;
}) {
  const code = opts.ifsc.replace(/\s/g, '').toUpperCase();
  const account = opts.accountNo.replace(/\s/g, '');
  if (!IFSC_RE.test(code)) {
    Alert.alert('Invalid IFSC', 'IFSC looks like HDFC0001234.');
    return;
  }
  if (!/^\d{9,18}$/.test(account)) {
    Alert.alert('Invalid account', 'Account number must be 9–18 digits.');
    return;
  }
  if (opts.holderName.trim().length < 2) {
    Alert.alert('Holder name', 'Enter the name as printed on the passbook.');
    return;
  }
  try {
    await opts.updateBank({
      accountNo: account,
      ifsc: code,
      holderName: opts.holderName.trim(),
    });
    if (opts.file) {
      await opts.uploadCheque(opts.file);
      opts.clearFile();
    }
    Alert.alert('Bank saved', 'Account saved. Upload cancelled cheque if needed.');
  } catch (error) {
    Alert.alert(
      'Could not save bank',
      getApiErrorMessage(error, 'Check IFSC and account number.')
    );
  }
}
