import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PartnerAgreementDocument } from '@/components/legal/PartnerAgreementDocument';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  formatPartnerAgreementDate,
  partnerAgreementVersionLabel,
} from '@/lib/legal/restaurant-partner-terms';

export default function PartnerAgreementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.back}
        >
          <ChevronLeft color="#111827" size={18} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          Partner Agreement
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator
      >
        <Text style={styles.kicker}>TOKAJO FOODS</Text>
        <Text style={styles.meta}>{partnerAgreementVersionLabel()}</Text>
        <Text style={styles.date}>As of {formatPartnerAgreementDate()}</Text>
        <PartnerAgreementDocument
          onOpenTerms={() => router.push('/legal/terms')}
          onOpenPrivacy={() => router.push('/legal/privacy')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  topTitle: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#111827',
  },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  kicker: {
    fontFamily: fonts.extraBold,
    fontSize: 13,
    letterSpacing: 1,
    color: authTheme.brand,
    marginBottom: 6,
  },
  meta: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.textMuted,
    marginBottom: 4,
  },
  date: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textDim,
    marginBottom: 16,
  },
});
