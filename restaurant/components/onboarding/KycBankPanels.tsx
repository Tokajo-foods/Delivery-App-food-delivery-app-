import { Alert, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import {
  Field,
  UploadRow,
} from '@/components/onboarding/OnboardingFormParts';
import { canReuploadDoc, type UploadFile } from '@/components/onboarding/kyc-doc-meta';
import { onboardingStyles as styles } from '@/components/onboarding/onboarding-styles';
import type {
  IfscLookup,
  KycDocument,
  KycDocumentsList,
} from '@/lib/restaurant/onboarding-types';

function latest(
  docs: KycDocumentsList | undefined,
  type: KycDocument['type']
) {
  return docs?.documents.find((row) => row.type === type);
}

type Shared = {
  shell: object;
  docs?: KycDocumentsList;
  pendingFile: UploadFile | null;
  busyUpload: boolean;
  onPick: () => void;
};

export function OwnerPhotoPanel({
  shell,
  docs,
  pendingFile,
  busyUpload,
  onPick,
  onSave,
}: Shared & { onSave: () => void }) {
  const doc = latest(docs, 'ownerPhoto');
  return (
    <View style={shell}>
      <Text style={styles.formTitle}>Owner profile photo</Text>
      <Text style={styles.formHint}>
        Clear face photo of the owner or authorized signatory.
      </Text>
      {doc?.rejectReason ? (
        <Text style={styles.rejectText}>Rejected: {doc.rejectReason}</Text>
      ) : null}
      {canReuploadDoc(doc?.status) ? (
        <>
          <UploadRow
            file={pendingFile}
            doc={doc}
            onPick={onPick}
            label={doc?.url ? 'Re-upload owner photo' : 'Upload owner photo'}
          />
          <PrimaryButton
            label={doc?.url ? 'Save owner photo' : 'Upload owner photo'}
            loading={busyUpload}
            onPress={() => {
              if (!pendingFile) {
                Alert.alert('Pick a photo', 'Choose an owner photo first.');
                return;
              }
              onSave();
            }}
          />
        </>
      ) : (
        <Text style={styles.formHint}>Verified — locked.</Text>
      )}
    </View>
  );
}

export function BankAccountPanel({
  shell,
  docs,
  pendingFile,
  busyUpload,
  busyBank,
  onPick,
  onSaveBank,
  ifsc,
  setIfsc,
  accountNo,
  setAccountNo,
  holderName,
  setHolderName,
  ifscInfo,
}: Shared & {
  busyBank: boolean;
  onSaveBank: () => void;
  ifsc: string;
  setIfsc: (v: string) => void;
  accountNo: string;
  setAccountNo: (v: string) => void;
  holderName: string;
  setHolderName: (v: string) => void;
  ifscInfo?: IfscLookup;
}) {
  const passbook = latest(docs, 'passbook');
  return (
    <View style={shell}>
      <Text style={styles.formTitle}>Bank account</Text>
      <Text style={styles.formHint}>
        Account details plus passbook photo (first page with account info).
      </Text>
      {passbook?.rejectReason ? (
        <Text style={styles.rejectText}>
          Passbook rejected: {passbook.rejectReason}
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
      {canReuploadDoc(passbook?.status) ? (
        <UploadRow
          file={pendingFile}
          doc={passbook}
          onPick={onPick}
          label={
            passbook?.url ? 'Re-upload passbook photo' : 'Upload passbook photo'
          }
        />
      ) : (
        <Text style={styles.formHint}>Passbook verified — locked.</Text>
      )}
      <PrimaryButton
        label="Save bank & passbook"
        loading={busyBank || busyUpload}
        onPress={onSaveBank}
      />
    </View>
  );
}

export function CancelledChequePanel({
  shell,
  docs,
  pendingFile,
  busyUpload,
  onPick,
  onSave,
}: Shared & { onSave: () => void }) {
  const cheque = latest(docs, 'cancelledCheque');
  return (
    <View style={shell}>
      <Text style={styles.formTitle}>Cancelled cheque</Text>
      <Text style={styles.formHint}>
        Upload the cancelled cheque leaf (front). Write “CANCELLED” across it.
      </Text>
      {cheque?.rejectReason ? (
        <Text style={styles.rejectText}>Rejected: {cheque.rejectReason}</Text>
      ) : null}
      {canReuploadDoc(cheque?.status) ? (
        <>
          <UploadRow
            file={pendingFile}
            doc={cheque}
            onPick={onPick}
            label={
              cheque?.url
                ? 'Re-upload cancelled cheque'
                : 'Upload cancelled cheque'
            }
          />
          <PrimaryButton
            label="Save cancelled cheque"
            loading={busyUpload}
            onPress={() => {
              if (!pendingFile) {
                Alert.alert('Pick a photo', 'Choose the cancelled cheque first.');
                return;
              }
              onSave();
            }}
          />
        </>
      ) : (
        <Text style={styles.formHint}>Verified — locked.</Text>
      )}
    </View>
  );
}
