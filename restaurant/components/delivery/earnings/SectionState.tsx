import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { earningsStyles as styles } from '@/components/delivery/earnings/earnings-styles';
import { authTheme } from '@/constants/auth-theme';

type Props =
  | { kind: 'loading' }
  | { kind: 'empty'; message: string }
  | { kind: 'error'; message: string; onRetry: () => void };

/** Inline loading / empty / error block shared by the earnings cards and passbook. */
export function SectionState(props: Props) {
  if (props.kind === 'loading') {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={authTheme.brand} />
      </View>
    );
  }
  if (props.kind === 'empty') {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>{props.message}</Text>
      </View>
    );
  }
  return (
    <View style={styles.state}>
      <Text style={styles.errorText}>{props.message}</Text>
      <Pressable onPress={props.onRetry} style={styles.retry} hitSlop={6}>
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}
