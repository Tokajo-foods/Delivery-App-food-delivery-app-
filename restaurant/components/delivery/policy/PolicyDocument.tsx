import { Text, View } from 'react-native';

import { policyStyles as styles } from '@/components/delivery/policy/policy-styles';
import {
  RIDER_POLICY_DECLARATION,
  RIDER_POLICY_SECTIONS,
} from '@/lib/delivery-partner/policy-content';

/** Read-only body of the rider onboarding policy. */
export function PolicyDocument() {
  return (
    <>
      <Text style={styles.intro}>
        Please read the full policy before you start delivering with Tokajo.
        You need to accept every condition to continue.
      </Text>

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
