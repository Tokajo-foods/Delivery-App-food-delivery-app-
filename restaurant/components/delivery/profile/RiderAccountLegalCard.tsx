import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronRight, FileText, Scale, Shield } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import {
  RIDER_POLICY_TITLE,
  riderPolicyVersionLabel,
} from '@/lib/delivery-partner/policy-content';
import { useRiderPolicyStatus } from '@/lib/delivery-partner/policy-hooks';

function formatAcceptedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function RiderAccountLegalCard() {
  const router = useRouter();
  const policy = useRiderPolicyStatus();
  const version = policy.data?.currentVersion ?? '';
  const accepted = policy.data?.accepted === true;
  const acceptedAt = formatAcceptedAt(policy.data?.acceptedAt);

  const policyMeta = policy.isLoading
    ? 'Loading acceptance status…'
    : accepted
      ? `Accepted${acceptedAt ? ` · ${acceptedAt} IST` : ''}${version ? ` · ${riderPolicyVersionLabel(version)}` : ''}`
      : version
        ? `${riderPolicyVersionLabel(version)} · pending acceptance`
        : RIDER_POLICY_TITLE;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Legal & compliance</Text>
      <Text style={styles.hint}>
        Documents you accept on the home screen are stored on your partner profile. You can reopen
        them anytime here.
      </Text>

      {policy.isLoading ? (
        <ActivityIndicator color={authTheme.brand} style={{ marginVertical: 12 }} />
      ) : null}

      <Pressable
        style={[styles.row, styles.rowBorder]}
        onPress={() => router.push(DELIVERY_ROUTES.policy as never)}
        accessibilityRole="button"
      >
        <View style={styles.iconWrap}>
          <Scale color={authTheme.brand} size={16} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.label}>Rider onboarding policy</Text>
            {accepted ? <CheckCircle2 color={authTheme.success} size={14} /> : null}
          </View>
          <Text style={styles.meta}>{policyMeta}</Text>
        </View>
        <ChevronRight color={authTheme.textDim} size={16} />
      </Pressable>

      <Pressable
        style={[styles.row, styles.rowBorder]}
        onPress={() => router.push('/legal/terms')}
        accessibilityRole="button"
      >
        <View style={styles.iconWrap}>
          <FileText color={authTheme.brand} size={16} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Terms of use</Text>
          <Text style={styles.meta}>General platform terms</Text>
        </View>
        <ChevronRight color={authTheme.textDim} size={16} />
      </Pressable>

      <Pressable style={styles.row} onPress={() => router.push('/legal/privacy')} accessibilityRole="button">
        <View style={styles.iconWrap}>
          <Shield color={authTheme.brand} size={16} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Privacy policy</Text>
          <Text style={styles.meta}>How we handle your data</Text>
        </View>
        <ChevronRight color={authTheme.textDim} size={16} />
      </Pressable>
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
