import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useOrderCalls } from '@/lib/call/use-order-calls';
import type { CallRole, ViewerKind } from '@/lib/call/types';

type Props = {
  orderId: string;
  viewer: ViewerKind;
};

const ROLE_LABEL: Record<CallRole, string> = {
  customer: 'Customer',
  restaurant: 'Restaurant',
  rider: 'Rider',
};

export function OrderCallPanel({ orderId, viewer }: Props) {
  const calls = useOrderCalls(orderId, viewer);
  if (!orderId) return null;
  const incoming = calls.live?.direction === 'in' && calls.live.state === 'ringing';

  return (
    <View style={styles.card}>
      <Text style={styles.disclosure}>{calls.disclosure}</Text>
      {calls.loading && calls.rows.length === 0 ? (
        <ActivityIndicator color="#EA4B14" />
      ) : null}
      {calls.loadError ? <Text style={styles.error}>{calls.loadError}</Text> : null}
      {calls.notice ? <Text style={styles.notice}>{calls.notice}</Text> : null}
      {!calls.loading && calls.rows.length === 0 && !calls.loadError ? (
        <Text style={styles.empty}>No virtual number is ready yet. Chat still works.</Text>
      ) : null}
      {calls.live ? (
        <View style={styles.live}>
          <Text style={styles.liveText}>
            {incoming
              ? `${ROLE_LABEL[calls.live.role]} is calling`
              : `${ROLE_LABEL[calls.live.role]} · ${calls.live.state.replace('_', ' ')}`}
          </Text>
          {incoming ? (
            <View style={styles.actions}>
              <Pressable disabled={Boolean(calls.busy)} onPress={() => void calls.accept()} style={styles.primary}>
                <Text style={styles.primaryText}>Accept</Text>
              </Pressable>
              <Pressable disabled={Boolean(calls.busy)} onPress={() => void calls.decline()} style={styles.secondary}>
                <Text style={styles.secondaryText}>Decline</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable disabled={Boolean(calls.busy)} onPress={() => void calls.hangup()} style={styles.secondary}>
              <Text style={styles.secondaryText}>End</Text>
            </Pressable>
          )}
        </View>
      ) : null}
      {calls.rows.map((row) => (
        <View key={row.role} style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.number}>
              {row.virtualNumber ?? 'No virtual number yet'}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              disabled={!row.virtualNumber || Boolean(calls.busy)}
              onPress={() => void calls.dial(row.role)}
              style={[styles.primary, (!row.virtualNumber || calls.busy) && styles.disabled]}
            >
              <Text style={styles.primaryText}>
                {calls.busy === `cell:${row.role}` ? 'Calling…' : 'Phone'}
              </Text>
            </Pressable>
            <Pressable
              disabled={!row.internetAvailable || Boolean(calls.busy)}
              onPress={() => void calls.startInternet(row.role)}
              style={[styles.secondary, (!row.internetAvailable || calls.busy) && styles.disabled]}
            >
              <Text style={styles.secondaryText}>
                {calls.busy === `net:${row.role}` ? 'Ringing…' : 'In-app'}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E7E5E4',
    padding: 14,
    gap: 10,
  },
  disclosure: { color: '#57534E', fontSize: 12, lineHeight: 17 },
  error: { color: '#B91C1C', fontSize: 13, lineHeight: 18 },
  notice: { color: '#9A3412', fontSize: 13, lineHeight: 18 },
  empty: { color: '#57534E', fontSize: 13 },
  live: { gap: 8, backgroundColor: '#FFF7ED', borderRadius: 12, padding: 10 },
  liveText: { color: '#111827', fontSize: 14, fontWeight: '600' },
  row: { gap: 8 },
  copy: { gap: 2 },
  label: { color: '#111827', fontSize: 14, fontWeight: '700' },
  number: { color: '#44403C', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8 },
  primary: {
    backgroundColor: '#EA4B14',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  secondary: {
    backgroundColor: '#F5F5F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryText: { color: '#111827', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.45 },
});
