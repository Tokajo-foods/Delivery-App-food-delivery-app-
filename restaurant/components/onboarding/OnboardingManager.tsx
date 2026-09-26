import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { RestaurantPageHeader } from '@/components/dashboard/RestaurantPageHeader';
import { KycDocumentsAccordion } from '@/components/onboarding/KycDocumentsAccordion';
import { type KycExpandKey } from '@/components/onboarding/KycExpandPanels';
import { OnboardingStatusHeader } from '@/components/onboarding/OnboardingStatusHeader';
import { type UploadFile } from '@/components/onboarding/kyc-doc-meta';
import { pickKycPhoto } from '@/components/onboarding/kyc-pick';
import { saveKycBank, saveKycLicense } from '@/components/onboarding/kyc-save';
import { onboardingStyles as styles } from '@/components/onboarding/onboarding-styles';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import { useMyRestaurantId } from '@/lib/order/hooks';
import { isListingLive } from '@/lib/restaurant/listing-status';
import {
  useIfscLookup,
  useOnboardingDocuments,
  useOnboardingMutations,
  useOnboardingStatus,
  useRestaurantBank,
} from '@/lib/restaurant/onboarding-hooks';
import { type OnboardingStepKey } from '@/lib/restaurant/onboarding-types';

export function OnboardingManager() {
  const router = useRouter();
  const restaurant = useMyRestaurantId();
  const restaurantId = restaurant.data?.id ?? '';
  const statusQuery = useOnboardingStatus(restaurantId);
  const docsQuery = useOnboardingDocuments(restaurantId);
  const bankQuery = useRestaurantBank(restaurantId);
  const mutations = useOnboardingMutations(restaurantId);

  const [expand, setExpand] = useState<KycExpandKey>(null);
  const [fssaiNo, setFssaiNo] = useState('');
  const [gstin, setGstin] = useState('');
  const [panNo, setPanNo] = useState('');
  const [idProofType, setIdProofType] = useState<
    'aadhaar' | 'driving_license' | 'voter_id' | 'passport' | 'other'
  >('aadhaar');
  const [ifsc, setIfsc] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [holderName, setHolderName] = useState('');
  const pendingFile = useMemo(() => ({ current: null as UploadFile | null }), []);
  const [, setFileTick] = useState(0);

  const ifscQuery = useIfscLookup(restaurantId, ifsc);
  const status = statusQuery.data;
  const docs = docsQuery.data;
  const bank = bankQuery.data;
  const listingLive = isListingLive(status?.listingStatus);

  const setPicked = (file: UploadFile | null) => {
    pendingFile.current = file;
    setFileTick((n) => n + 1);
  };

  const refresh = async () => {
    await Promise.all([
      statusQuery.refetch(),
      docsQuery.refetch(),
      bankQuery.refetch(),
    ]);
  };

  const runUpload = async (
    payload: Parameters<typeof mutations.uploadDocuments.mutateAsync>[0]
  ) => {
    try {
      await mutations.uploadDocuments.mutateAsync(payload);
      setPicked(null);
      Alert.alert('Saved', 'Document uploaded. Ops will review it.');
    } catch (error) {
      Alert.alert(
        'Upload failed',
        getApiErrorMessage(error, 'Could not upload document')
      );
    }
  };

  const stepNav = (key: OnboardingStepKey) => {
    if (key === 'profile' || key === 'address') {
      router.push('/settings');
      return;
    }
    if (key === 'menu') {
      router.push('/menu');
      return;
    }
    const map: Partial<Record<OnboardingStepKey, KycExpandKey>> = {
      fssai: 'fssai',
      gst: 'gst',
      pan: 'pan',
      idProof: 'idProof',
      bank: 'bank',
      cancelledCheque: 'cancelledCheque',
      photos: 'photos',
    };
    const next = map[key] ?? null;
    if (!next) return;
    setExpand(expand === next ? null : next);
    setPicked(null);
  };

  const saveLicense = async (kind: 'fssai' | 'gst' | 'pan' | 'idProof') => {
    await saveKycLicense({
      kind,
      fssaiNo,
      gstin,
      panNo,
      idProofType,
      file: pendingFile.current,
      runUpload,
    });
  };

  const saveBank = async () => {
    await saveKycBank({
      ifsc,
      accountNo,
      holderName,
      file: pendingFile.current,
      updateBank: (body) => mutations.updateBank.mutateAsync(body),
      uploadCheque: (file) =>
        mutations.uploadDocuments.mutateAsync({ cancelledCheque: file }),
      clearFile: () => setPicked(null),
    });
  };

  const loading =
    (statusQuery.isLoading && !status) ||
    (docsQuery.isLoading && !docs) ||
    (bankQuery.isLoading && !bank);

  return (
    <View style={styles.screen}>
      <RestaurantPageHeader
        title="Listing & KYC"
        subtitle="Upload docs · re-upload if rejected · go live"
        showBack
        hideProfile
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={
              statusQuery.isRefetching ||
              docsQuery.isRefetching ||
              bankQuery.isRefetching
            }
            onRefresh={() => void refresh()}
            tintColor={authTheme.brand}
            colors={[authTheme.brand]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {!restaurantId ? (
          <Text style={styles.muted}>Complete restaurant setup first.</Text>
        ) : loading ? (
          <ActivityIndicator color={authTheme.brand} style={{ marginTop: 24 }} />
        ) : statusQuery.isError ? (
          <Text style={styles.error}>
            {getApiErrorMessage(statusQuery.error, 'Could not load onboarding')}
          </Text>
        ) : status ? (
          <>
            <OnboardingStatusHeader
              status={status}
              bankLabel={
                bank?.payoutsEnabled
                  ? 'Verified'
                  : bank?.verificationStatus || '—'
              }
              bankLive={bank?.payoutsEnabled === true}
            />

            <Text style={styles.sectionLabel}>Documents</Text>
            <KycDocumentsAccordion
              steps={status.steps}
              expand={expand}
              docs={docs}
              pendingFile={pendingFile.current}
              busyUpload={mutations.uploadDocuments.isPending}
              busyBank={mutations.updateBank.isPending}
              fssaiNo={fssaiNo}
              setFssaiNo={setFssaiNo}
              gstin={gstin}
              setGstin={setGstin}
              panNo={panNo}
              setPanNo={setPanNo}
              idProofType={idProofType}
              setIdProofType={setIdProofType}
              ifsc={ifsc}
              setIfsc={setIfsc}
              accountNo={accountNo}
              setAccountNo={setAccountNo}
              holderName={holderName}
              setHolderName={setHolderName}
              ifscInfo={ifscQuery.data}
              onStepPress={stepNav}
              onPick={() => {
                void pickKycPhoto().then((file) => {
                  if (file) setPicked(file);
                });
              }}
              onSaveLicense={(kind) => void saveLicense(kind)}
              onSaveBank={() => void saveBank()}
              onUploadPhoto={() => {
                if (!pendingFile.current) return;
                void runUpload({ outletPhotos: [pendingFile.current] });
              }}
            />

            {!listingLive ? (
              <PrimaryButton
                label="Submit for review"
                loading={mutations.submitKyc.isPending}
                disabled={!status.canSubmit}
                onPress={() => {
                  Alert.alert(
                    'Submit for review?',
                    'Ops verifies each document. When all are verified, your listing goes live.',
                    [
                      { text: 'Not now', style: 'cancel' },
                      {
                        text: 'Submit',
                        onPress: () => {
                          void mutations.submitKyc
                            .mutateAsync()
                            .then(() =>
                              Alert.alert(
                                'Submitted',
                                'You’ll get push + inbox alerts if a document is rejected or when you’re set to go live.'
                              )
                            )
                            .catch((error) =>
                              Alert.alert(
                                'Cannot submit',
                                getApiErrorMessage(
                                  error,
                                  'Finish required documents first.'
                                )
                              )
                            );
                        },
                      },
                    ]
                  );
                }}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
