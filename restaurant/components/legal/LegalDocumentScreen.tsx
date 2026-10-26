import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ChevronLeft } from 'lucide-react-native';
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
import type { LegalSection } from '@/lib/legal/urls';
import { LEGAL_CONTACT_EMAIL } from '@/lib/legal/urls';

type Props = {
  title: string;
  updated: string;
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
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        <Text style={styles.updated}>{updated}</Text>
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
        {email ? (
          <Pressable
            onPress={() =>
              void openUrl(
                `mailto:${LEGAL_CONTACT_EMAIL}`,
                'Could not open email'
              )
            }
            style={styles.primaryBtn}
            accessibilityRole="link"
            accessibilityLabel={`Email ${LEGAL_CONTACT_EMAIL}`}
          >
            <Text style={styles.primaryBtnText}>Email {LEGAL_CONTACT_EMAIL}</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => void openUrl(publicUrl, 'Could not open the public page')}
          style={styles.linkBtn}
          accessibilityRole="link"
          accessibilityLabel={`Open the public ${title} page`}
        >
          <Text style={styles.linkText}>Open the public page</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: authTheme.cardBorder,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    color: authTheme.text,
  },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  updated: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.textDim,
    marginBottom: 8,
  },
  section: { marginTop: 18 },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: authTheme.text,
    marginBottom: 6,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: authTheme.textMuted,
    marginBottom: 8,
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: authTheme.brand,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  linkBtn: { marginTop: 16, paddingVertical: 8 },
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
