import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bike, Mic, MicOff, Phone, Store, User, Video } from 'lucide-react-native';

import { useOrderCalls } from '@/lib/call/use-order-calls';
import type { CallRole, CallRow, ViewerKind } from '@/lib/call/types';

type Props = {
  orderId: string;
  viewer: ViewerKind;
  names?: Partial<Record<CallRole, string>>;
};

const FALLBACK: Record<CallRole, string> = {
  customer: 'Customer',
  restaurant: 'Restaurant',
  rider: 'Delivery partner',
};

const BRAND = '#EA4B14';

export function OrderCallPanel({ orderId, viewer, names }: Props) {
  const calls = useOrderCalls(orderId, viewer);
  if (!orderId) return null;
  const incoming = calls.live?.direction === 'in' && calls.live.state === 'ringing';
  const titleFor = (role: CallRole) => names?.[role] || FALLBACK[role];

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>Call</Text>
      <Text style={styles.title}>Reach them without sharing your number</Text>
      <Text style={styles.disclosure}>{calls.disclosure}</Text>

      {calls.loading && calls.rows.length === 0 ? (
        <ActivityIndicator color={BRAND} style={styles.spinner} />
      ) : null}
      {calls.loadError ? <Text style={styles.error}>{calls.loadError}</Text> : null}
      {calls.notice ? <Text style={styles.notice}>{calls.notice}</Text> : null}

      {calls.live ? (
        <View style={[styles.live, incoming && styles.liveIn]}>
          <Text style={styles.liveKicker}>{incoming ? 'Incoming call' : liveKicker(calls.live.state)}</Text>
          <Text style={styles.liveText}>{liveLine(incoming, calls.live.state, titleFor(calls.live.role))}</Text>
          {incoming ? (
            <View style={styles.actions}>
              <Pressable disabled={Boolean(calls.busy)} onPress={() => void calls.accept()} style={styles.primary}>
                <Text style={styles.primaryText}>{calls.busy === 'accept' ? 'Joining…' : 'Accept'}</Text>
              </Pressable>
              <Pressable disabled={Boolean(calls.busy)} onPress={() => void calls.decline()} style={styles.ghost}>
                <Text style={styles.ghostText}>Decline</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actions}>
              {calls.live.state === 'accepted' ? (
                <Pressable disabled={Boolean(calls.busy)} onPress={() => void calls.toggleMute()} style={styles.ghost}>
                  {calls.muted ? <MicOff color="#111827" size={14} /> : <Mic color="#111827" size={14} />}
                  <Text style={styles.ghostText}>{calls.muted ? 'Unmute' : 'Mute'}</Text>
                </Pressable>
              ) : null}
              <Pressable disabled={Boolean(calls.busy)} onPress={() => void calls.hangup()} style={styles.end}>
                <Text style={styles.primaryText}>{calls.busy === 'end' ? 'Ending…' : 'End call'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}

      {!calls.loading && calls.rows.length === 0 && !calls.loadError ? (
        <Text style={styles.empty}>{emptyCopy(viewer)}</Text>
      ) : null}

      {calls.rows.map((row) => (
        <PersonRow
          key={row.role}
          row={row}
          title={titleFor(row.role)}
          busy={calls.busy}
          onPhone={() => void calls.dial(row.role)}
          onInternet={() => void calls.startInternet(row.role)}
        />
      ))}
    </View>
  );
}

function emptyCopy(viewer: ViewerKind): string {
  if (viewer === 'rider') {
    return 'Customer and restaurant calls show after you accept the order. Chat still works.';
  }
  return 'The customer call shows after the order is placed. The delivery partner call shows after they accept. Chat still works.';
}

function liveKicker(state: string): string {
  if (state === 'ringing') return 'Ringing';
  if (state === 'accepted') return 'Connected';
  return 'On a call';
}

function liveLine(incoming: boolean, state: string, title: string): string {
  if (incoming) return `${title} is calling you`;
  if (state === 'ringing') return `Ringing ${title}`;
  if (state === 'accepted') return `Talking with ${title}`;
  return title;
}

function PersonIcon({ role }: { role: CallRole }) {
  if (role === 'rider') return <Bike color={BRAND} size={18} strokeWidth={2.3} />;
  if (role === 'customer') return <User color={BRAND} size={18} strokeWidth={2.3} />;
  return <Store color={BRAND} size={18} strokeWidth={2.3} />;
}

function PersonRow({
  row,
  title,
  busy,
  onPhone,
  onInternet,
}: {
  row: CallRow;
  title: string;
  busy: string | null;
  onPhone: () => void;
  onInternet: () => void;
}) {
  const phoneBusy = busy === `cell:${row.role}`;
  const netBusy = busy === `net:${row.role}`;
  return (
    <View style={styles.person}>
      <View style={styles.personHead}>
        <View style={styles.iconWrap}>
          <PersonIcon role={row.role} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label} numberOfLines={1}>{title}</Text>
          <Text style={styles.number} numberOfLines={1}>
            {row.virtualNumber ?? 'Phone number is not ready yet'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          disabled={!row.virtualNumber || Boolean(busy)}
          onPress={onPhone}
          style={[styles.primary, (!row.virtualNumber || busy) && styles.disabled]}
        >
          <Phone color="#FFFFFF" size={14} strokeWidth={2.4} />
          <Text style={styles.primaryText}>{phoneBusy ? 'Calling…' : 'Phone'}</Text>
        </Pressable>
        <Pressable
          disabled={!row.internetAvailable || Boolean(busy)}
          onPress={onInternet}
          style={[styles.secondary, (!row.internetAvailable || busy) && styles.disabled]}
        >
          <Video color="#111827" size={14} strokeWidth={2.4} />
          <Text style={styles.secondaryText}>{netBusy ? 'Ringing…' : 'In-app'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E7E5E4',
  },
  kicker: {
    color: BRAND,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: { color: '#111827', fontSize: 16, fontWeight: '700' },
  disclosure: { color: '#57534E', fontSize: 12, lineHeight: 17 },
  spinner: { alignSelf: 'flex-start' },
  error: { color: '#B91C1C', fontSize: 13, lineHeight: 18 },
  notice: { color: '#9A3412', fontSize: 13, lineHeight: 18 },
  empty: { color: '#57534E', fontSize: 13, lineHeight: 18 },
  live: { gap: 8, backgroundColor: '#FFF7ED', borderRadius: 14, padding: 12 },
  liveIn: { backgroundColor: '#ECFDF5' },
  liveKicker: { color: '#C2410C', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  liveText: { color: '#111827', fontSize: 15, fontWeight: '700' },
  person: {
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E7E5E4',
  },
  personHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  label: { color: '#111827', fontSize: 15, fontWeight: '700' },
  number: { color: '#57534E', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 8 },
  primary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 11,
  },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F5F5F4',
    borderRadius: 12,
    paddingVertical: 11,
  },
  secondaryText: { color: '#111827', fontSize: 14, fontWeight: '700' },
  ghost: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
  },
  ghostText: { color: '#111827', fontSize: 14, fontWeight: '700' },
  end: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 11,
  },
  disabled: { opacity: 0.4 },
});
