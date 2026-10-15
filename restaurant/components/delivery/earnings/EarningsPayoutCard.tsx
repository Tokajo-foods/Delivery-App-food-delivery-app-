import { useRouter } from 'expo-router';
import { Landmark, Trophy } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { EarningsIncentiveRow } from '@/components/delivery/earnings/EarningsIncentiveRow';
import { overviewStyles as styles } from '@/components/delivery/earnings/earnings-overview-styles';
import { authTheme } from '@/constants/auth-theme';
import type { PartnerIncentive } from '@/lib/delivery-partner/analytics-types';
import { bankStatusLabel, isBankVerified, type PartnerBank } from '@/lib/delivery-partner/bank-types';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

type Props = {
  currency: string;
  bank?: PartnerBank | null;
  bankError: boolean;
  nextPayout: string | null;
  scheduleNote: string | null;
  incentives: PartnerIncentive[];
};

export function EarningsPayoutCard({ currency, bank, bankError, nextPayout, scheduleNote, incentives }: Props) {
  const router = useRouter();
  const verified = isBankVerified(bank);

  return (
    <>
      <Pressable onPress={() => router.push(DELIVERY_ROUTES.profile)} style={styles.card}>
        <View style={styles.cardHead}>
          <View style={[styles.cardIcon, { backgroundColor: '#EFF6FF' }]}>
            <Landmark color="#1D4ED8" size={18} />
          </View>
          <Text style={styles.cardTitle}>Payout account</Text>
          <Text style={styles.link}>{bank?.hasAccount ? 'Manage' : 'Add bank'}</Text>
        </View>
        {bankError && !bank ? (
          <Text style={styles.caption}>Could not load bank details. Pull down to retry.</Text>
        ) : bank?.hasAccount ? (
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Account</Text>
              <Text style={styles.statValue}>{bank.accountMasked || '—'}</Text>
              <Text style={[styles.statMeta, { color: verified ? '#15803D' : '#B45309' }]}>
                {bankStatusLabel(bank.verificationStatus)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Next payout</Text>
              <Text style={styles.statValue}>{nextPayout ?? '—'}</Text>
              {scheduleNote ? <Text style={styles.statMeta}>{scheduleNote}</Text> : null}
            </View>
          </View>
        ) : (
          <Text style={styles.caption}>
            Add your bank account and IFSC in Profile to receive weekly payouts.
          </Text>
        )}
      </Pressable>

      {incentives.length ? (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={[styles.cardIcon, { backgroundColor: '#FFF1E8' }]}>
              <Trophy color={authTheme.brand} size={18} />
            </View>
            <Text style={styles.cardTitle}>Incentives</Text>
            <Pressable onPress={() => router.push(DELIVERY_ROUTES.incentives)} hitSlop={8}>
              <Text style={styles.link}>See all</Text>
            </Pressable>
          </View>
          {incentives.slice(0, 2).map((item) => (
            <EarningsIncentiveRow key={item.id} item={item} currency={currency} />
          ))}
        </View>
      ) : null}
    </>
  );
}
