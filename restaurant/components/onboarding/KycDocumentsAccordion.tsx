import { View } from 'react-native';

import {
  KycExpandPanels,
  type KycExpandKey,
} from '@/components/onboarding/KycExpandPanels';
import { StepRow } from '@/components/onboarding/OnboardingFormParts';
import type { UploadFile } from '@/components/onboarding/kyc-doc-meta';
import { onboardingStyles as styles } from '@/components/onboarding/onboarding-styles';
import type {
  IfscLookup,
  KycDocument,
  KycDocumentsList,
  OnboardingStep,
  OnboardingStepKey,
} from '@/lib/restaurant/onboarding-types';

const EXPANDABLE: OnboardingStepKey[] = [
  'ownerPhoto',
  'fssai',
  'gst',
  'pan',
  'idProof',
  'bank',
  'cancelledCheque',
  'photos',
];

type Props = {
  steps: OnboardingStep[];
  expand: KycExpandKey;
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
  idProofType: 'aadhaar' | 'driving_license' | 'voter_id' | 'passport' | 'other';
  setIdProofType: (
    v: 'aadhaar' | 'driving_license' | 'voter_id' | 'passport' | 'other'
  ) => void;
  ifsc: string;
  setIfsc: (v: string) => void;
  accountNo: string;
  setAccountNo: (v: string) => void;
  holderName: string;
  setHolderName: (v: string) => void;
  ifscInfo?: IfscLookup;
  onStepPress: (key: OnboardingStepKey) => void;
  onPick: () => void;
  onSaveLicense: (kind: 'fssai' | 'gst' | 'pan' | 'idProof') => void;
  onSaveBank: () => void;
  onSaveOwnerPhoto: () => void;
  onSaveCheque: () => void;
  onUploadPhoto: () => void;
};

function latestDoc(
  docs: KycDocumentsList | undefined,
  type: KycDocument['type']
) {
  return docs?.documents.find((row) => row.type === type);
}

function docForStep(
  step: OnboardingStep,
  docs: KycDocumentsList | undefined
): KycDocument | undefined {
  if (
    step.key === 'fssai' ||
    step.key === 'gst' ||
    step.key === 'pan' ||
    step.key === 'idProof' ||
    step.key === 'ownerPhoto'
  ) {
    return latestDoc(docs, step.key);
  }
  if (step.key === 'bank') {
    return latestDoc(docs, 'passbook');
  }
  if (step.key === 'cancelledCheque') {
    return latestDoc(docs, 'cancelledCheque');
  }
  return undefined;
}

function expandKeyFor(step: OnboardingStep): KycExpandKey {
  return EXPANDABLE.includes(step.key) ? (step.key as KycExpandKey) : null;
}

export function KycDocumentsAccordion(props: Props) {
  const { steps, expand, docs, onStepPress } = props;

  return (
    <View style={styles.card}>
      {steps.map((step, index) => {
        const expandKey = expandKeyFor(step);
        const isExpanded = expandKey != null && expand === expandKey;
        const doc = docForStep(step, docs);
        const isLast = index === steps.length - 1 && !isExpanded;

        return (
          <View key={step.key}>
            <StepRow
              step={step}
              last={isLast}
              expanded={isExpanded}
              docStatus={doc?.status}
              rejectReason={doc?.rejectReason}
              onPress={() => onStepPress(step.key)}
            />
            {isExpanded ? (
              <KycExpandPanels
                expand={expand}
                nested
                docs={docs}
                pendingFile={props.pendingFile}
                busyUpload={props.busyUpload}
                busyBank={props.busyBank}
                fssaiNo={props.fssaiNo}
                setFssaiNo={props.setFssaiNo}
                gstin={props.gstin}
                setGstin={props.setGstin}
                panNo={props.panNo}
                setPanNo={props.setPanNo}
                idProofType={props.idProofType}
                setIdProofType={props.setIdProofType}
                ifsc={props.ifsc}
                setIfsc={props.setIfsc}
                accountNo={props.accountNo}
                setAccountNo={props.setAccountNo}
                holderName={props.holderName}
                setHolderName={props.setHolderName}
                ifscInfo={props.ifscInfo}
                onPick={props.onPick}
                onSaveLicense={props.onSaveLicense}
                onSaveBank={props.onSaveBank}
                onSaveOwnerPhoto={props.onSaveOwnerPhoto}
                onSaveCheque={props.onSaveCheque}
                onUploadPhoto={props.onUploadPhoto}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
