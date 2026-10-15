import { ActivityIndicator, Text, View } from 'react-native';

import { SectionState } from '@/components/delivery/earnings/SectionState';
import { earningsStyles as styles } from '@/components/delivery/earnings/earnings-styles';
import { authTheme } from '@/constants/auth-theme';

export function PassbookHeader({ days, total }: { days: number; total: number }) {
  return (
    <View style={styles.passbookHead}>
      <Text style={styles.cardTitle}>Passbook</Text>
      <Text style={styles.cardSub}>
        Trips paid in the last {days} days{total ? ` · ${total} ${total === 1 ? 'trip' : 'trips'}` : ''}
      </Text>
    </View>
  );
}

type FooterProps = {
  loading: boolean;
  error: string | null;
  empty: boolean;
  loadingMore: boolean;
  days: number;
  onRetry: () => void;
};

/** Closes the passbook card: first-load / error / empty state, or the next-page spinner. */
export function PassbookFooter({ loading, error, empty, loadingMore, days, onRetry }: FooterProps) {
  return (
    <View style={styles.passbookFoot}>
      {loading ? (
        <SectionState kind="loading" />
      ) : error && empty ? (
        <SectionState kind="error" message={error} onRetry={onRetry} />
      ) : empty ? (
        <SectionState kind="empty" message={`No paid trips in the last ${days} days.`} />
      ) : loadingMore ? (
        <View style={styles.state}>
          <ActivityIndicator color={authTheme.brand} />
        </View>
      ) : error ? (
        <SectionState kind="error" message={error} onRetry={onRetry} />
      ) : null}
    </View>
  );
}
