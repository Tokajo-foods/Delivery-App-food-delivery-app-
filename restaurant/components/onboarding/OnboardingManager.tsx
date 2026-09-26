import * as ImagePicker from 'expo-image-picker';
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
import {
  KycExpandPanels,
  type KycExpandKey,
} from '@/components/onboarding/KycExpandPanels';
import { StepRow } from '@/components/onboarding/OnboardingFormParts';
import { OnboardingStatusHeader } from '@/components/onboarding/OnboardingStatusHeader';
import { type UploadFile } from '@/components/onboarding/kyc-doc-meta';
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
import {
  FSSAI_RE,
  GSTIN_RE,
  IFSC_RE,
  KYC_FILE,
  PAN_RE,
  type KycDocType,
  type OnboardingStepKey,
} from '@/lib/restaurant/onboarding-types';

function mimeFromAsset(asset: ImagePicker.ImagePickerAsset) {
  const mime = (asset.mimeType || '').toLowerCase();
  if (mime) return mime;
  const name = (asset.fileName || asset.uri).toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function pickKycPhoto(): Promise<UploadFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Photos needed', 'Allow photo access to upload KYC documents.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > KYC_FILE.maxBytes) {
    Alert.alert('File too large', 'Each document must be under 8 MB.');
    return null;
  }
  const mime = mimeFromAsset(asset);
  const ext = mime.includes('png') ? 'png' : 'jpg';
  return {
    uri: asset.uri,
    fileName: asset.fileName || `kyc-${Date.now()}.${ext}`,
    mimeType: mime.startsWith('image/') ? mime : 'image/jpeg',
  };
}

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

  const latest = (type: KycDocType) =>
    docs?.documents.find((row) => row.type === type);

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
    if (kind === 'fssai') {
      if (fssaiNo && !FSSAI_RE.test(fssaiNo)) {
        Alert.alert('Invalid FSSAI', 'FSSAI license must be 14 digits.');
        return;
      }
      await runUpload({
        fssaiLicense: fssaiNo || undefined,
        fssai: pendingFile.current ?? undefined,
      });
      return;
    }
    if (kind === 'gst') {
      const value = gstin.trim().toUpperCase();
      if (value && !GSTIN_RE.test(value)) {
        Alert.alert('Invalid GSTIN', 'Enter a valid 15-character GSTIN.');
        return;
      }
      await runUpload({
        gstin: value || undefined,
        gst: pendingFile.current ?? undefined,
      });
      return;
    }
    if (kind === 'idProof') {
      await runUpload({
        idProofType,
        idProof: pendingFile.current ?? undefined,
      });
      return;
    }
    const value = panNo.trim().toUpperCase();
    if (value && !PAN_RE.test(value)) {
      Alert.alert('Invalid PAN', 'Enter a valid 10-character PAN.');
      return;
    }
    await runUpload({
      panNumber: value || undefined,
      pan: pendingFile.current ?? undefined,
    });
  };

  const saveBank = async () => {
    const code = ifsc.replace(/\s/g, '').toUpperCase();
    const account = accountNo.replace(/\s/g, '');
    if (!IFSC_RE.test(code)) {
      Alert.alert('Invalid IFSC', 'IFSC looks like HDFC0001234.');
      return;
    }
    if (!/^\d{9,18}$/.test(account)) {
      Alert.alert('Invalid account', 'Account number must be 9–18 digits.');
      return;
    }
    if (holderName.trim().length < 2) {
      Alert.alert('Holder name', 'Enter the name as printed on the passbook.');
      return;
    }
    try {
      await mutations.updateBank.mutateAsync({
        accountNo: account,
        ifsc: code,
        holderName: holderName.trim(),
      });
      if (pendingFile.current) {
        await mutations.uploadDocuments.mutateAsync({
          cancelledCheque: pendingFile.current,
        });
        setPicked(null);
      }
      Alert.alert('Bank saved', 'Account saved. Upload cancelled cheque if needed.');
    } catch (error) {
      Alert.alert(
        'Could not save bank',
        getApiErrorMessage(error, 'Check IFSC and account number.')
      );
    }
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
            <View style={styles.card}>
              {status.steps.map((step, index) => {
                const doc =
                  step.key === 'fssai' ||
                  step.key === 'gst' ||
                  step.key === 'pan' ||
                  step.key === 'idProof'
                    ? latest(step.key)
                    : step.key === 'bank' || step.key === 'cancelledCheque'
                      ? latest('cancelledCheque')
                      : undefined;
                return (
                  <StepRow
                    key={step.key}
                    step={step}
                    last={index === status.steps.length - 1}
                    expanded={
                      expand === step.key ||
                      (step.key === 'bank' && expand === 'cancelledCheque')
                    }
                    docStatus={doc?.status}
                    rejectReason={doc?.rejectReason}
                    onPress={() => stepNav(step.key)}
                  />
                );
              })}
            </View>

            <KycExpandPanels
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
