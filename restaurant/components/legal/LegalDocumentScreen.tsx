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
        <Text style={styles.kicker}>{BRAND_NAME}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.summary}>{summary}</Text>
        <Text style={styles.updated}>{updated}</Text>

        {email ? (
          <Pressable
            onPress={() =>
              void openUrl(`mailto:${LEGAL_CONTACT_EMAIL}`, 'Could not open email')
            }
            style={styles.mailCard}
            accessibilityRole="link"
            accessibilityLabel={`Email ${LEGAL_CONTACT_EMAIL}`}
          >
            <Mail color={authTheme.brand} size={16} />
            <View style={styles.mailCopy}>
              <Text style={styles.mailAddress}>{LEGAL_CONTACT_EMAIL}</Text>
              <Text style={styles.mailHint}>Reply within 2 working days</Text>
            </View>
          </Pressable>
        ) : null}

        {sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
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
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: authTheme.cardBorder,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    marginLeft: 4,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: authTheme.text,
  },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  kicker: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: authTheme.brand,
  },
  heroTitle: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.2,
    color: authTheme.text,
  },
  summary: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: authTheme.textMuted,
  },
  updated: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textDim,
  },
  mailCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: authTheme.surface,
  },
  mailCopy: { flex: 1 },
  mailAddress: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.text,
  },
  mailHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: authTheme.textMuted,
  },
  section: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: authTheme.cardBorder,
  },
  heading: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  paragraph: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: authTheme.textMuted,
  },
  linkBtn: { marginTop: 22, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: authTheme.cardBorder },
  linkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  url: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: authTheme.textDim,
  },
});
