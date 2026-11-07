import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft, Mail } from 'lucide-react-native';
import { useCallback } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { BRAND_NAME } from '@/constants/theme';
import type { LegalSection } from '@/lib/legal/urls';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal/urls';

type Props = {
  title: string;
  updated: string;
  summary: string;
  publicUrl: string;
  sections: LegalSection[];
  email?: boolean;
};

async function openUrl(url: string, failure: string) {
  try {
    if (url.startsWith('mailto:')) {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Email is not available on this phone', LEGAL_CONTACT_EMAIL);
        return;
      }
      await Linking.openURL(url);
      return;
    }
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Alert.alert(failure, url.replace(/^mailto:/, ''));
  }
}

export function LegalDocumentScreen({
  title,
  updated,
  summary,
  publicUrl,
  sections,
  email,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  }, [router]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.back}
        >
          <ChevronLeft color={authTheme.text} size={22} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>{BRAND_NAME}</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.summary}>{summary}</Text>
          <View style={styles.datePill}>
            <Text style={styles.updated}>{updated}</Text>
          </View>
        </View>

        {email ? (
          <Pressable
            onPress={() =>
              void openUrl(`mailto:${LEGAL_CONTACT_EMAIL}`, 'Could not open email')
            }
            style={styles.mailCard}
            accessibilityRole="link"
            accessibilityLabel={`Email ${LEGAL_CONTACT_EMAIL}`}
          >
            <View style={styles.mailIcon}>
              <Mail color={authTheme.brand} size={20} />
            </View>
            <View style={styles.mailCopy}>
              <Text style={styles.mailLabel}>Email support</Text>
              <Text style={styles.mailAddress}>{LEGAL_CONTACT_EMAIL}</Text>
              <Text style={styles.mailHint}>We aim to reply within 2 working days</Text>
            </View>
          </Pressable>
        ) : null}

        {sections.map((section, index) => (
          <View key={section.heading} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.index}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <Text style={styles.heading}>{section.heading}</Text>
            </View>
            {section.body.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <Pressable
          onPress={() => void openUrl(publicUrl, 'Could not open the public page')}
          style={styles.linkBtn}
          accessibilityRole="link"
          accessibilityLabel={`Open the public ${title} page`}
        >
          <Text style={styles.linkText}>Read this page on tokajofoods.com</Text>
          <Text style={styles.url} selectable>
            {publicUrl}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: authTheme.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: authTheme.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: authTheme.cardBorder,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: authTheme.brandSoft,
  },
  topTitle: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: authTheme.text,
  },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  hero: {
    backgroundColor: authTheme.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: authTheme.brand,
  },
  heroTitle: {
    marginTop: 6,
    fontFamily: fonts.extraBold,
    fontSize: 28,
    letterSpacing: -0.4,
    color: authTheme.text,
  },
  summary: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: authTheme.textMuted,
  },
  datePill: {
    alignSelf: 'flex-start',
    marginTop: 14,
    backgroundColor: authTheme.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  updated: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.brandDark,
  },
  mailCard: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: authTheme.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  mailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.brandSoft,
  },
  mailCopy: { flex: 1 },
  mailLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
  },
  mailAddress: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.brand,
  },
  mailHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: authTheme.textDim,
  },
  card: {
    marginTop: 12,
    backgroundColor: authTheme.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  index: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: authTheme.brand,
  },
  indexText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  heading: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: authTheme.text,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: authTheme.textMuted,
    marginTop: 6,
  },
  linkBtn: { marginTop: 18, paddingVertical: 8 },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.brand,
  },
  url: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.textDim,
  },
});
