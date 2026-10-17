import { StatusBar } from 'expo-status-bar';
import { ChevronDown, Lock, Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CallAvatar } from '@/components/call/CallAvatar';
import { CallControl } from '@/components/call/CallControl';
import { fonts } from '@/constants/typography';
import { peerSubtitle, type ActiveCall } from '@/lib/call/call-store';

type Props = {
  call: ActiveCall;
  muted: boolean;
  speaker: boolean;
  busy: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onMinimize?: () => void;
  /** Set for a moment after the call closes, like WhatsApp's "Call ended" frame. */
  endedLabel?: string | null;
};

export function formatCallDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function useStatus(call: ActiveCall): string {
  const [now, setNow] = useState(Date.now());
  const [openedAt] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (call.phase === 'incoming') return 'Incoming voice call';
  if (call.phase === 'connecting') return 'Connecting…';
  if (call.reconnecting) return 'Reconnecting…';
  if (call.phase === 'outgoing') return now - openedAt < 2000 ? 'Calling…' : 'Ringing…';
  return formatCallDuration(Math.max(0, Math.floor((now - (call.connectedAt ?? now)) / 1000)));
}

/** WhatsApp-style full-screen call: incoming, ringing out, and in-call. */
export function CallScreen(props: Props) {
  const { call, muted, speaker, busy } = props;
  const insets = useSafeAreaInsets();
  const liveStatus = useStatus(call);
  const ended = Boolean(props.endedLabel);
  const status = props.endedLabel || liveStatus;
  const incoming = call.phase === 'incoming';
  const ringing = !ended && (incoming || call.phase === 'outgoing');

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        {props.onMinimize && !incoming && !ended ? (
          <Pressable onPress={props.onMinimize} hitSlop={12} accessibilityLabel="Minimise call">
            <ChevronDown color="#D1D7DB" size={26} />
          </Pressable>
        ) : (
          <View style={styles.topSpacer} />
        )}
        <View style={styles.privacy}>
          <Lock color="#8696A0" size={12} />
          <Text style={styles.privacyText}>Tokajo voice call · number hidden</Text>
        </View>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.head}>
        <CallAvatar name={call.peerName} role={call.peerRole} logoUrl={call.peerLogoUrl} pulsing={ringing} />
        <Text style={styles.name} numberOfLines={2}>
          {call.peerName}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {peerSubtitle(call)}
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          numberOfLines={2}
          style={[
            styles.status,
            !ended && call.phase === 'active' && !call.reconnecting && styles.timer,
            ended && styles.endedStatus,
          ]}
        >
          {status}
        </Text>
      </View>

      {incoming ? (
        <View style={[styles.answerRow, ended && styles.endedControls]} pointerEvents={ended ? 'none' : 'auto'}>
          <CallControl
            label="Decline"
            tone="end"
            size={74}
            busy={busy === 'decline'}
            disabled={Boolean(busy)}
            onPress={props.onDecline}
            icon={<PhoneOff color="#FFFFFF" size={30} />}
          />
          <CallControl
            label="Accept"
            tone="accept"
            size={74}
            busy={busy === 'accept'}
            disabled={Boolean(busy)}
            onPress={props.onAccept}
            icon={<Phone color="#FFFFFF" size={30} />}
          />
        </View>
      ) : (
        <View style={[styles.panel, ended && styles.endedControls]} pointerEvents={ended ? 'none' : 'auto'}>
          <CallControl
            label="Speaker"
            tone={speaker ? 'on' : 'neutral'}
            onPress={props.onToggleSpeaker}
            icon={<Volume2 color={speaker ? '#0B141A' : '#FFFFFF'} size={26} />}
          />
          <CallControl
            label={muted ? 'Unmute' : 'Mute'}
            tone={muted ? 'on' : 'neutral'}
            disabled={call.phase !== 'active'}
            onPress={props.onToggleMute}
            icon={muted ? <MicOff color="#0B141A" size={26} /> : <Mic color="#FFFFFF" size={26} />}
          />
          <CallControl
            label="End"
            tone="end"
            busy={busy === 'end'}
            disabled={busy === 'end'}
            onPress={props.onHangup}
            icon={<PhoneOff color="#FFFFFF" size={26} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0B141A',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topSpacer: { width: 26 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  privacyText: { fontFamily: fonts.medium, fontSize: 12, color: '#8696A0' },
  head: { alignItems: 'center', marginTop: 12 },
  name: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 28,
    color: '#E9EDEF',
    textAlign: 'center',
  },
  sub: { marginTop: 6, fontFamily: fonts.medium, fontSize: 14, color: '#8696A0' },
  status: {
    marginTop: 14,
    paddingHorizontal: 12,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#D1D7DB',
    textAlign: 'center',
  },
  timer: { letterSpacing: 1, fontVariant: ['tabular-nums'] },
  endedStatus: { color: '#F28B82' },
  endedControls: { opacity: 0.35 },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  panel: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    backgroundColor: '#1F2C34',
    borderRadius: 28,
    paddingTop: 18,
    paddingBottom: 14,
  },
});
