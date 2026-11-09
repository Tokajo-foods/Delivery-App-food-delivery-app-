import { useRouter } from 'expo-router';
import { Check, ExternalLink, ShieldCheck } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  RESTAURANT_PARTNER_TERMS_POINTS,
} from '@/lib/legal/restaurant-partner-terms';
import { LEGAL_URLS } from '@/lib/legal/urls';
import { partnerTermsApi } from '@/lib/user/partner-terms-api';
import { useAuthStore } from '@/store/auth-store';

type Props = {
  visible: boolean;
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  onAccepted: () => void;
};

export function RestaurantPartnerTermsGate({
  visible,
  loading,
  loadError,
  onRetry,
  onAccepted,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(async () => {
    if (!checked || busy) return;
    setBusy(true);
    setError(null);
    try {
      await partnerTermsApi.accept();
      setChecked(false);
      onAccepted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save acceptance. Try again.');
    } finally {
      setBusy(false);
    }
  }, [busy, checked, onAccepted]);

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" statusBarTranslucent presentationStyle="fullScreen">
      <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <ShieldCheck color={authTheme.brand} size={28} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>Restaurant Partner Agreement</Text>
          <Text style={styles.subtitle}>
            Read these terms before you use TOKAJO Restaurant. You need to accept them to open the
            app and take orders.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerLoad}>
            <ActivityIndicator color={authTheme.brand} size="large" />
            <Text style={styles.loadHint}>Loading partner terms…</Text>
          </View>
        ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollBody,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
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
          {RESTAURANT_PARTNER_TERMS_POINTS.map((point, index) => (
            <View key={point.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.index}>{index + 1}</Text>
                <Text style={styles.cardTitle}>{point.title}</Text>
              </View>
              <Text style={styles.cardBody}>{point.body}</Text>
            </View>
          ))}

          <View style={styles.linksRow}>
            <Pressable
              style={styles.linkBtn}
              onPress={() => router.push('/legal/terms')}
            >
              <Text style={styles.linkText}>Full terms in app</Text>
              <ExternalLink color={authTheme.brand} size={14} />
            </Pressable>
            <Pressable
              style={styles.linkBtn}
              onPress={() => void Linking.openURL(LEGAL_URLS.privacy)}
            >
              <Text style={styles.linkText}>Privacy policy</Text>
              <ExternalLink color={authTheme.brand} size={14} />
            </Pressable>
          </View>

          <Pressable
            style={styles.checkRow}
            onPress={() => setChecked((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
          >
            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
              {checked ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.checkCopy}>
              I am 18 or older and I accept all Restaurant Partner terms above, including the
              Privacy Policy. I understand Tokajo records this acceptance on my account.
            </Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        )}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <PrimaryButton
            label={busy ? 'Saving…' : 'Accept and continue'}
            onPress={() => void accept()}
            disabled={!checked || busy || loading || Boolean(loadError)}
          />
          {busy ? (
            <ActivityIndicator color={authTheme.brand} style={{ marginTop: 10 }} />
          ) : null}
          <Pressable onPress={() => void logout()} style={styles.logout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F6F7' },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 6,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: authTheme.text,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: authTheme.textMuted,
  },
  scroll: { flex: 1 },
  scrollBody: { paddingHorizontal: 16, gap: 10, paddingTop: 4 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 6,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  index: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: authTheme.brand,
    backgroundColor: authTheme.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  cardBody: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: authTheme.textMuted,
  },
  linksRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.brand,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF4EE',
    borderWidth: 1,
    borderColor: 'rgba(234, 75, 20, 0.15)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: authTheme.inputBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxOn: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
  },
  checkCopy: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: authTheme.text,
  },
  centerLoad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadHint: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: authTheme.textMuted,
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: authTheme.brandSoft,
  },
  retryText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: authTheme.brand,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.error,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#F6F6F7',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: authTheme.cardBorder,
    gap: 4,
  },
  logout: { alignItems: 'center', paddingVertical: 12 },
  logoutText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.textMuted,
  },
});
