import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  ELECTRONIC_ACCEPTANCE_HEADING,
  ELECTRONIC_ACCEPTANCE_INTRO,
  ELECTRONIC_ACCEPTANCE_POINTS,
  PARTNER_AGREEMENT_EFFECTIVE_NOTE,
  RESTAURANT_PARTNER_AGREEMENT_WELCOME,
  RESTAURANT_PARTNER_ALL_SECTIONS,
  RESTAURANT_PARTNER_SUMMARY_BULLETS,
  RESTAURANT_PARTNER_SUMMARY_HEADING,
  TOKAJO_LEGAL_ENTITY,
} from '@/lib/legal/restaurant-partner-terms';
import { LEGAL_CONTACT_EMAIL, LEGAL_URLS } from '@/lib/legal/urls';

type Props = {
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  showPrivacyLinks?: boolean;
  /** Tighter layout for the acceptance modal. */
  compact?: boolean;
};

export function PartnerAgreementDocument({
  onOpenTerms,
  onOpenPrivacy,
  showPrivacyLinks = true,
  compact = false,
}: Props) {
  const c = compact;

  return (
    <View>
      <View style={[styles.summaryCard, c && styles.summaryCardCompact]}>
        <Text style={[styles.summaryTitle, c && styles.summaryTitleCompact]}>
          {RESTAURANT_PARTNER_SUMMARY_HEADING}
        </Text>
        {c ? (
          <View style={styles.summaryGrid}>
            {RESTAURANT_PARTNER_SUMMARY_BULLETS.map((line) => (
              <View key={line} style={styles.summaryChip}>
                <Text style={styles.summaryChipText} numberOfLines={2}>
                  {line}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          RESTAURANT_PARTNER_SUMMARY_BULLETS.map((line) => (
            <View key={line} style={styles.summaryLine}>
              <Text style={styles.summaryBullet}>•</Text>
              <Text style={styles.summaryText}>{line}</Text>
            </View>
          ))
        )}
      </View>

      {!c ? (
        <>
          <Text style={styles.welcome}>{RESTAURANT_PARTNER_AGREEMENT_WELCOME}</Text>
          <Text style={styles.effectiveNote}>{PARTNER_AGREEMENT_EFFECTIVE_NOTE}</Text>
        </>
      ) : (
        <Text style={styles.welcomeCompact} numberOfLines={3}>
          {RESTAURANT_PARTNER_AGREEMENT_WELCOME}
        </Text>
      )}

      {RESTAURANT_PARTNER_ALL_SECTIONS.map((section) => (
        <View key={section.id} style={[styles.section, c && styles.sectionCompact]}>
          <Text style={[styles.sectionHeading, c && styles.sectionHeadingCompact]}>
            {section.number}. {section.heading}
          </Text>
          <Text style={[styles.sectionBody, c && styles.sectionBodyCompact]}>{section.body}</Text>
        </View>
      ))}

      <View style={[styles.entityCard, c && styles.entityCardCompact]}>
        <Text style={styles.entityTitle}>{TOKAJO_LEGAL_ENTITY.legalName}</Text>
        {!c ? (
          <>
            <Text style={styles.entityLine}>{TOKAJO_LEGAL_ENTITY.registeredOffice}</Text>
            <Text style={styles.entityLine}>
              {TOKAJO_LEGAL_ENTITY.grievanceLabel}: {TOKAJO_LEGAL_ENTITY.grievanceEmail}
            </Text>
          </>
        ) : null}
        <Text style={styles.entityLine}>
          Grievance: {TOKAJO_LEGAL_ENTITY.grievanceEmail} · {TOKAJO_LEGAL_ENTITY.supportChannel}
        </Text>
      </View>

      <View style={[styles.electronicBlock, c && styles.electronicBlockCompact]}>
        <Text style={[styles.electronicHeading, c && styles.electronicHeadingCompact]}>
          {ELECTRONIC_ACCEPTANCE_HEADING}
        </Text>
        {!c ? <Text style={styles.electronicIntro}>{ELECTRONIC_ACCEPTANCE_INTRO}</Text> : null}
        {ELECTRONIC_ACCEPTANCE_POINTS.map((point, index) => (
          <View key={point} style={[styles.electronicLine, c && styles.electronicLineCompact]}>
            <Text style={styles.electronicNum}>{index + 1}.</Text>
            <Text style={[styles.electronicText, c && styles.electronicTextCompact]}>{point}</Text>
          </View>
        ))}
      </View>

      {showPrivacyLinks ? (
        <View style={styles.legalLinks}>
          {onOpenTerms ? (
            <Pressable onPress={onOpenTerms}>
              <Text style={styles.link}>General terms of use</Text>
            </Pressable>
          ) : null}
          {onOpenTerms ? <Text style={styles.linkDot}> · </Text> : null}
          <Pressable
            onPress={() => {
              if (onOpenPrivacy) onOpenPrivacy();
              else void Linking.openURL(LEGAL_URLS.privacy);
            }}
          >
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
        </View>
      ) : null}

      {!c ? (
        <Text style={styles.footerContact}>Partner support: {LEGAL_CONTACT_EMAIL}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8ECF0',
    marginBottom: 16,
  },
  summaryCardCompact: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  summaryTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: authTheme.text,
    marginBottom: 10,
  },
  summaryTitleCompact: {
    fontSize: 12,
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryChip: {
    width: '48%',
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
  },
  summaryChipText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    lineHeight: 14,
    color: '#475569',
  },
  summaryLine: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  summaryBullet: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 19,
    color: authTheme.brand,
  },
  summaryText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 19,
    color: '#475569',
  },
  welcome: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 19,
    color: '#475569',
    marginBottom: 10,
  },
  welcomeCompact: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: authTheme.textMuted,
    marginBottom: 10,
  },
  effectiveNote: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 17,
    color: authTheme.textDim,
    marginBottom: 18,
  },
  section: { marginBottom: 16 },
  sectionCompact: { marginBottom: 9 },
  sectionHeading: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: authTheme.text,
    marginBottom: 6,
  },
  sectionHeadingCompact: {
    fontSize: 12,
    marginBottom: 3,
  },
  sectionBody: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 19,
    color: '#475569',
  },
  sectionBodyCompact: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#64748B',
  },
  entityCard: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FAFBFC',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  entityCardCompact: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  entityTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: authTheme.text,
    marginBottom: 2,
  },
  entityLine: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: authTheme.textMuted,
  },
  electronicBlock: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFBFA',
    borderWidth: 1,
    borderColor: 'rgba(234, 75, 20, 0.12)',
  },
  electronicBlockCompact: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
  },
  electronicHeading: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: authTheme.text,
    marginBottom: 6,
  },
  electronicHeadingCompact: {
    fontSize: 12,
    marginBottom: 4,
  },
  electronicIntro: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: authTheme.textMuted,
    marginBottom: 10,
  },
  electronicLine: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  electronicLineCompact: { marginBottom: 3 },
  electronicNum: {
    width: 16,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 16,
    color: authTheme.textDim,
  },
  electronicText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
  electronicTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.brand,
    textDecorationLine: 'underline',
  },
  linkDot: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textDim },
  footerContact: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textDim,
    textAlign: 'center',
    marginBottom: 8,
  },
});
