import { useRouter } from 'expo-router';
import { ChevronRight, FileText, Scale, Shield } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { partnerAgreementVersionLabel } from '@/lib/legal/restaurant-partner-terms';

const ROWS = [
  {
    id: 'partner',
    label: 'Partner Agreement',
    meta: partnerAgreementVersionLabel(),
    href: '/legal/partner-agreement' as const,
    icon: Scale,
  },
  {
    id: 'terms',
    label: 'Terms of use',
    meta: 'General platform terms',
    href: '/legal/terms' as const,
    icon: FileText,
  },
  {
    id: 'privacy',
    label: 'Privacy policy',
    meta: 'How we handle data',
    href: '/legal/privacy' as const,
    icon: Shield,
  },
];

export function KitchenAccountLegalCard() {
  const router = useRouter();

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Legal documents</Text>
      <Text style={styles.hint}>
        Partner Agreement includes all sections you accept before using the kitchen app.
      </Text>
      {ROWS.map((row, index) => {
        const Icon = row.icon;
        return (
          <Pressable
            key={row.id}
            style={[styles.row, index < ROWS.length - 1 && styles.rowBorder]}
            onPress={() => router.push(row.href)}
            accessibilityRole="button"
          >
            <View style={styles.iconWrap}>
              <Icon color={authTheme.brand} size={16} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{row.label}</Text>
              <Text style={styles.meta}>{row.meta}</Text>
            </View>
            <ChevronRight color={authTheme.textDim} size={16} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
    marginBottom: 4,
  },
  hint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: authTheme.textMuted,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: authTheme.cardBorder,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textDim,
    marginTop: 2,
  },
});
