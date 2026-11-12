import { Text, View } from 'react-native';

import { policyStyles as styles } from '@/components/delivery/policy/policy-styles';
import {
  RIDER_ELECTRONIC_ACCEPTANCE_HEADING,
  RIDER_ELECTRONIC_ACCEPTANCE_INTRO,
  RIDER_ELECTRONIC_ACCEPTANCE_POINTS,
  RIDER_POLICY_DECLARATION,
  RIDER_POLICY_SECTIONS,
  RIDER_POLICY_WELCOME,
} from '@/lib/delivery-partner/policy-content';

type Props = {
  /** Tighter typography for the home modal sheet. */
  compact?: boolean;
  /** Shown in the acceptance modal (same pattern as restaurant partner agreement). */
  showElectronicAcceptance?: boolean;
};

/** Read-only body of the rider onboarding policy. */
export function PolicyDocument({ compact, showElectronicAcceptance }: Props) {
  return (
    <>
      <Text style={[styles.intro, compact && styles.introCompact]}>
        {RIDER_POLICY_WELCOME}
      </Text>

      {showElectronicAcceptance ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{RIDER_ELECTRONIC_ACCEPTANCE_HEADING}</Text>
          <Text style={[styles.bulletText, { marginTop: 6 }]}>{RIDER_ELECTRONIC_ACCEPTANCE_INTRO}</Text>
          {RIDER_ELECTRONIC_ACCEPTANCE_POINTS.map((line) => (
            <View key={line} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {RIDER_POLICY_SECTIONS.map((section, index) => (
        <View key={section.title} style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionNo}>
              <Text style={styles.sectionNoText}>{index + 1}</Text>
            </View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          {section.body.map((line) => (
            <View key={line} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.declaration}>
        <Text style={styles.declarationTitle}>Declaration</Text>
        <Text style={styles.bulletText}>{RIDER_POLICY_DECLARATION}</Text>
      </View>
    </>
  );
}
