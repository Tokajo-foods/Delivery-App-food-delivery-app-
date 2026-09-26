import { Alert, Pressable, Text, View } from 'react-native';

import {
  Field,
  LicenseCard,
  UploadRow,
} from '@/components/onboarding/OnboardingFormParts';
import { canReuploadDoc, type UploadFile } from '@/components/onboarding/kyc-doc-meta';
import { onboardingStyles as styles } from '@/components/onboarding/onboarding-styles';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import type {
  IfscLookup,
  KycDocument,
  KycDocumentsList,
} from '@/lib/restaurant/onboarding-types';

const ID_TYPES = [
  'aadhaar',
  'driving_license',
  'voter_id',
  'passport',
  'other',
] as const;

export type KycExpandKey =
  | 'fssai'
  | 'gst'
  | 'pan'
  | 'idProof'
  | 'bank'
  | 'cancelledCheque'
  | 'photos'
  | null;

type Props = {
  expand: KycExpandKey;
  nested?: boolean;
  docs?: KycDocumentsList;
  pendingFile: UploadFile | null;
  busyUpload: boolean;
  busyBank: boolean;
  fssaiNo: string;
  setFssaiNo: (v: string) => void;
  gstin: string;
  setGstin: (v: string) => void;
  panNo: string;
  setPanNo: (v: string) => void;
  idProofType: (typeof ID_TYPES)[number];
  setIdProofType: (v: (typeof ID_TYPES)[number]) => void;
  ifsc: string;
  setIfsc: (v: string) => void;
  accountNo: string;
  setAccountNo: (v: string) => void;
  holderName: string;
  setHolderName: (v: string) => void;
  ifscInfo?: IfscLookup;
  onPick: () => void;
  onSaveLicense: (kind: 'fssai' | 'gst' | 'pan' | 'idProof') => void;
  onSaveBank: () => void;
  onUploadPhoto: () => void;
};

function latest(
  docs: KycDocumentsList | undefined,
  type: KycDocument['type']
) {
  return docs?.documents.find((row) => row.type === type);
}

export function KycExpandPanels(props: Props) {
  const {
    expand,
    nested,
    docs,
    pendingFile,
    busyUpload,
    busyBank,
    fssaiNo,
    setFssaiNo,
    gstin,
    setGstin,
    panNo,
    setPanNo,
    idProofType,
    setIdProofType,
    ifsc,
    setIfsc,
    accountNo,
    setAccountNo,
    holderName,
    setHolderName,
    ifscInfo,
    onPick,
    onSaveLicense,
    onSaveBank,
    onUploadPhoto,
  } = props;

  const shell = nested ? styles.formCardNested : styles.formCard;

  if (expand === 'fssai') {
    return (
      <LicenseCard
        nested={nested}
        title="FSSAI license"
        hint="14-digit number + certificate photo."
        placeholder="14-digit FSSAI"
        value={fssaiNo}
        onChangeText={(t) => setFssaiNo(t.replace(/\D/g, '').slice(0, 14))}
        masked={docs?.fssaiMasked}
        doc={latest(docs, 'fssai')}
        file={pendingFile}
        busy={busyUpload}
        onPick={onPick}
        onSave={() => onSaveLicense('fssai')}
        keyboard="number-pad"
        maxLength={14}
      />
    );
  }

  if (expand === 'gst') {
    return (
      <LicenseCard
        nested={nested}
        title="GST certificate"
        hint="Optional GSTIN + certificate photo."
        placeholder="15-character GSTIN"
        value={gstin}
        onChangeText={(t) => setGstin(t.toUpperCase().slice(0, 15))}
        masked={docs?.gstinMasked}
        doc={latest(docs, 'gst')}
        file={pendingFile}
        busy={busyUpload}
        onPick={onPick}
        onSave={() => onSaveLicense('gst')}
        autoCapitalize="characters"
        maxLength={15}
      />
    );
  }

  if (expand === 'pan') {
    return (
      <LicenseCard
        nested={nested}
        title="PAN card"
        hint="10-character PAN + card photo."
        placeholder="ABCDE1234F"
        value={panNo}
        onChangeText={(t) => setPanNo(t.toUpperCase().slice(0, 10))}
        masked={docs?.panMasked}
        doc={latest(docs, 'pan')}
        file={pendingFile}
        busy={busyUpload}
        onPick={onPick}
        onSave={() => onSaveLicense('pan')}
        autoCapitalize="characters"
        maxLength={10}
      />
    );
  }

  if (expand === 'idProof') {
    const doc = latest(docs, 'idProof');
    return (
      <View style={shell}>
        <Text style={styles.formTitle}>ID proof</Text>
        <Text style={styles.formHint}>
          Aadhaar / DL / Voter ID / Passport of the owner.
        </Text>
        {doc?.rejectReason ? (
          <Text style={styles.rejectText}>Why rejected: {doc.rejectReason}</Text>
        ) : null}
        {canReuploadDoc(doc?.status) ? (
          <>
            <View style={styles.idChipRow}>
              {ID_TYPES.map((type) => {
                const on = idProofType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setIdProofType(type)}
                    style={[styles.idChip, on && styles.idChipOn]}
                  >
                    <Text
                      style={[styles.idChipText, on && styles.idChipTextOn]}
                    >
                      {type.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <UploadRow
              file={pendingFile}
              doc={doc}
              onPick={onPick}
              label={
                doc?.status === 'rejected'
                  ? 'Re-upload ID proof'
                  : 'Upload ID proof'
              }
            />
            <PrimaryButton
              label="Save ID proof"
              loading={busyUpload}
              onPress={() => onSaveLicense('idProof')}
            />
          </>
        ) : (
          <Text style={styles.formHint}>
            Verified — locked until admin requests re-upload.
          </Text>
        )}
      </View>
    );
  }

  if (expand === 'bank' || expand === 'cancelledCheque') {
    const cheque = latest(docs, 'cancelledCheque');
    return (
      <View style={shell}>
        <Text style={styles.formTitle}>Bank & cancelled cheque</Text>
        <Text style={styles.formHint}>
          Account details plus cancelled cheque / passbook photo.
        </Text>
        {cheque?.rejectReason ? (
          <Text style={styles.rejectText}>
            Cheque rejected: {cheque.rejectReason}
          </Text>
        ) : null}
        <Field
          label="IFSC"
          value={ifsc}
          onChangeText={(t) => setIfsc(t.toUpperCase().slice(0, 11))}
          placeholder="HDFC0001234"
          autoCapitalize="characters"
          maxLength={11}
        />
        {ifscInfo ? (
          <Text style={styles.formHint}>
            {ifscInfo.bank} · {ifscInfo.branch}
          </Text>
        ) : null}
        <Field
          label="Account number"
          value={accountNo}
          onChangeText={(t) => setAccountNo(t.replace(/\D/g, '').slice(0, 18))}
          placeholder="9–18 digits"
          keyboardType="number-pad"
        />
        <Field
          label="Holder name"
          value={holderName}
          onChangeText={setHolderName}
          placeholder="As on passbook"
        />
        {canReuploadDoc(cheque?.status) ? (
          <UploadRow
            file={pendingFile}
            doc={cheque}
            onPick={onPick}
            label="Upload cancelled cheque"
          />
        ) : (
          <Text style={styles.formHint}>Cheque verified — locked.</Text>
        )}
        <PrimaryButton
          label="Save bank details"
          loading={busyBank || busyUpload}
          onPress={onSaveBank}
        />
      </View>
    );
  }

  if (expand === 'photos') {
    return (
      <View style={shell}>
        <Text style={styles.formTitle}>Outlet photos</Text>
        <Text style={styles.formHint}>
          Optional storefront / interior photos (max 8).
        </Text>
        <UploadRow
          file={pendingFile}
          onPick={onPick}
          label="Add outlet photo"
        />
        <PrimaryButton
          label="Upload photo"
          loading={busyUpload}
          onPress={() => {
            if (!pendingFile) {
              Alert.alert('Pick a photo', 'Choose an outlet photo first.');
              return;
            }
            onUploadPhoto();
          }}
        />
      </View>
    );
  }

  return null;
}
