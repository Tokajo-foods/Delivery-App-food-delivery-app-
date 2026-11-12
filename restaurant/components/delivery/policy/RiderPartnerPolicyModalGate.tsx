import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { PolicyDocument } from '@/components/delivery/policy/PolicyDocument';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import {
  RIDER_POLICY_CHECKBOX_LABEL,
  RIDER_POLICY_FOOTNOTE,
  RIDER_POLICY_SECTIONS,
  RIDER_POLICY_TITLE,
  RIDER_POLICY_VERSION,
  riderPolicyVersionLabel,
} from '@/lib/delivery-partner/policy-content';
import { useAcceptRiderPolicy, useRiderPolicyStatus } from '@/lib/delivery-partner/policy-hooks';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/auth-store';

type Props = {
  visible: boolean;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onAccepted: () => void;
};

const SECTION_COUNT = RIDER_POLICY_SECTIONS.length;
const SHEET_MAX_H = Math.min(Dimensions.get('window').height * 0.81, 580);

function shortAgreementDate(): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());
}

function AgreementBackdrop() {
  return (
    <>
      <LinearGradient
        colors={['rgba(15, 23, 42, 0.72)', 'rgba(15, 23, 42, 0.88)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.backdropVeil]} pointerEvents="none" />
    </>
  );
}

/** Blurred overlay + policy sheet — same pattern as restaurant partner terms on home. */
export function RiderPartnerPolicyModalGate({
  visible,
  loading,
  loadError,
  onRetry,
  onAccepted,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const accept = useAcceptRiderPolicy();
  const policyStatus = useRiderPolicyStatus(visible);
  const acceptVersion =
    policyStatus.data?.currentVersion?.trim() || RIDER_POLICY_VERSION;
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = accept.isPending;

  const onAcceptPress = useCallback(() => {
    if (!checked || busy || loading || loadError) return;
    setError(null);
    accept.mutate(acceptVersion, {
      onSuccess: () => {
        setChecked(false);
        onAccepted();
      },
      onError: (err) => {
        const code = getApiErrorCode(err);
        setError(
          code === 'POLICY_VERSION_MISMATCH'
            ? 'A newer policy is available. Reload and accept the latest version.'
            : getApiErrorMessage(err, 'Could not save acceptance. Try again.')
        );
      },
    });
  }, [accept, acceptVersion, busy, checked, loadError, loading, onAccepted]);

  if (!visible) return null;

  const sheetMaxHeight = Math.min(
    SHEET_MAX_H,
    Dimensions.get('window').height - insets.top - insets.bottom - 22
  );

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.root}>
        <AgreementBackdrop />

        <View
          style={[
            styles.center,
            {
              paddingTop: insets.top + 6,
              paddingBottom: insets.bottom + 6,
              paddingHorizontal: 20,
            },
          ]}
        >
          <View style={[styles.sheet, { maxHeight: sheetMaxHeight }]}>
            <View style={styles.accentBar} />

            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.brand}>TOKAJO FOODS</Text>
                  <Text style={styles.title}>Partner Agreement</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{SECTION_COUNT} sections</Text>
                </View>
              </View>
              <Text style={styles.metaLine}>
                {RIDER_POLICY_TITLE} · {riderPolicyVersionLabel(acceptVersion)}
              </Text>
              <Text style={styles.intro}>
                Review the agreement, then accept at the bottom to continue · {shortAgreementDate()}
              </Text>
            </View>

            {loading ? (
              <View style={styles.centerLoad}>
                <ActivityIndicator color={authTheme.brand} size="large" />
                <Text style={styles.loadHint}>Loading…</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={[
                  styles.scrollBody,
                  { paddingBottom: Math.max(insets.bottom, 12) },
                ]}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {loadError ? (
                  <View style={styles.errorCard}>
                    <Text style={styles.error}>{loadError}</Text>
                    {onRetry ? (
                      <Pressable onPress={onRetry} style={styles.retryBtn}>
                        <Text style={styles.retryText}>Retry</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <PolicyDocument compact showElectronicAcceptance />

                <View style={styles.legalLinks}>
                  <Pressable onPress={() => router.push(DELIVERY_ROUTES.policy as never)}>
                    <Text style={styles.link}>Full document</Text>
                  </Pressable>
                  <Text style={styles.linkDot}> · </Text>
                  <Pressable onPress={() => router.push('/legal/terms')}>
                    <Text style={styles.link}>Terms</Text>
                  </Pressable>
                  <Text style={styles.linkDot}> · </Text>
                  <Pressable onPress={() => router.push('/legal/privacy')}>
                    <Text style={styles.link}>Privacy</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.checkRow}
                  onPress={() => setChecked((v) => !v)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  disabled={Boolean(loadError)}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxOn]}>
                    {checked ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
                  </View>
                  <Text style={styles.checkCopy}>{RIDER_POLICY_CHECKBOX_LABEL}</Text>
                </Pressable>

                {error ? <Text style={styles.inlineError}>{error}</Text> : null}

                <View style={styles.acceptBlock}>
                  <PrimaryButton
                    label={busy ? 'Saving…' : 'Accept & Continue'}
                    onPress={onAcceptPress}
                    disabled={!checked || busy || loading || Boolean(loadError)}
                  />
                  <Text style={styles.footnote}>{RIDER_POLICY_FOOTNOTE}</Text>
                  {busy ? (
                    <ActivityIndicator color={authTheme.brand} style={{ marginTop: 10 }} />
                  ) : null}
                </View>

                <Pressable
                  onPress={() => {
                    void (async () => {
                      await logout();
                      router.replace('/login');
                    })();
                  }}
                  style={styles.logout}
                >
                  <Text style={styles.logoutText}>Sign out</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdropVeil: { backgroundColor: 'rgba(0, 0, 0, 0.12)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 16,
  },
  accentBar: { height: 2, backgroundColor: authTheme.brand, width: '100%' },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8ECF0',
  },
  brand: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: authTheme.textDim,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    lineHeight: 21,
    color: authTheme.text,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  countBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: authTheme.textMuted,
  },
  metaLine: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textMuted,
  },
  intro: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: authTheme.textDim,
  },
  scroll: { flexGrow: 0, flexShrink: 1, backgroundColor: '#FFFFFF' },
  scrollBody: { paddingHorizontal: 16, paddingTop: 12 },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: authTheme.brand,
    textDecorationLine: 'underline',
  },
  linkDot: { fontFamily: fonts.medium, fontSize: 11, color: authTheme.textDim },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  checkCopy: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: authTheme.text,
  },
  acceptBlock: {
    marginBottom: 4,
    paddingTop: 2,
  },
  footnote: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: authTheme.textDim,
    textAlign: 'center',
  },
  centerLoad: {
    paddingVertical: 56,
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  loadHint: { fontFamily: fonts.medium, fontSize: 14, color: authTheme.textMuted },
  errorCard: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: authTheme.surface,
    alignItems: 'center',
    gap: 10,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: authTheme.brandSoft,
  },
  retryText: { fontFamily: fonts.bold, fontSize: 13, color: authTheme.brand },
  error: { fontFamily: fonts.medium, fontSize: 13, color: authTheme.error, textAlign: 'center' },
  inlineError: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  logout: { alignItems: 'center', paddingVertical: 10 },
  logoutText: { fontFamily: fonts.semiBold, fontSize: 13, color: authTheme.textMuted },
});
