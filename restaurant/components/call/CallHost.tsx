import { Phone } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CallScreen, formatCallDuration } from '@/components/call/CallScreen';
import { fonts } from '@/constants/typography';
import {
  acceptCall,
  declineCall,
  hangupCall,
  setMuted,
  setSpeaker,
} from '@/lib/call/call-engine';
import { useCallStore, type ActiveCall } from '@/lib/call/call-store';
import { useCallSync } from '@/lib/call/use-call-sync';
import { useAuthStore } from '@/store/auth-store';

type Props = { viewer: 'restaurant' | 'rider' };

const ENDED_FRAME_MS = 1500;
const noop = () => undefined;

function barStatus(call: ActiveCall, elapsed: number): string {
  if (call.phase === 'active') return call.reconnecting ? 'Reconnecting…' : formatCallDuration(elapsed);
  if (call.phase === 'connecting') return 'Connecting…';
  return 'Ringing…';
}

/** One call at a time for the whole app: full-screen UI, a minimised bar, and short notices. */
export function CallHost({ viewer }: Props) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const token = useAuthStore((s) => s.token);
  useCallSync(viewer, userId, Boolean(token));

  const call = useCallStore((s) => s.call);
  const busy = useCallStore((s) => s.busy);
  const muted = useCallStore((s) => s.muted);
  const speaker = useCallStore((s) => s.speaker);
  const notice = useCallStore((s) => s.notice);
  const [minimized, setMinimized] = useState(false);
  const [ended, setEnded] = useState<{ call: ActiveCall; label: string } | null>(null);
  const shownCall = useRef<ActiveCall | null>(null);
  const [, tick] = useState(0);

  const fullScreen = Boolean(call) && !minimized && !(call?.phase === 'incoming' && call.nativeRinging);

  useEffect(() => setMinimized(false), [call?.callId]);

  useEffect(() => {
    if (call) {
      shownCall.current = fullScreen ? call : null;
      setEnded(null);
      return undefined;
    }
    const last = shownCall.current;
    shownCall.current = null;
    if (!last) return undefined;
    const store = useCallStore.getState();
    setEnded({ call: last, label: store.notice ?? 'Call ended' });
    store.set({ notice: null });
    const timer = setTimeout(() => setEnded(null), ENDED_FRAME_MS);
    return () => clearTimeout(timer);
  }, [call, fullScreen]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => useCallStore.getState().set({ notice: null }), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!minimized || call?.phase !== 'active') return undefined;
    const timer = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [minimized, call?.phase]);

  const screenCall = fullScreen ? call : ended?.call ?? null;
  const elapsed = call?.connectedAt ? Math.floor((Date.now() - call.connectedAt) / 1000) : 0;

  return (
    <>
      {notice && !screenCall ? (
        <View style={[styles.toast, { top: insets.top + 8 }]} pointerEvents="none">
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      ) : null}
      {call && minimized ? (
        <Pressable
          style={[styles.bar, { top: insets.top + 6 }]}
          onPress={() => setMinimized(false)}
          accessibilityRole="button"
          accessibilityLabel={`Return to call with ${call.peerName}`}
        >
          <Phone color="#FFFFFF" size={14} />
          <Text style={styles.barText} numberOfLines={1}>
            {call.peerName} · {barStatus(call, elapsed)}
          </Text>
          <Text style={styles.barHint}>Tap to return</Text>
        </Pressable>
      ) : null}
      <Modal
        visible={Boolean(screenCall)}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (call && call.phase !== 'incoming') setMinimized(true);
        }}
      >
        {screenCall ? (
          <CallScreen
            call={screenCall}
            muted={muted}
            speaker={speaker}
            busy={call ? busy : null}
            endedLabel={call ? null : ended?.label}
            onAccept={call ? () => void acceptCall(call.callId) : noop}
            onDecline={call ? () => void declineCall(call.callId) : noop}
            onHangup={() => void hangupCall()}
            onToggleMute={() => void setMuted(!muted)}
            onToggleSpeaker={() => void setSpeaker(!speaker)}
            onMinimize={() => setMinimized(true)}
          />
        ) : null}
        {notice && call ? (
          <View style={[styles.toast, { top: insets.top + 48 }]} pointerEvents="none">
            <Text style={styles.toastText}>{notice}</Text>
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 300,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toastText: { fontFamily: fonts.medium, fontSize: 13, color: '#FFFFFF', textAlign: 'center' },
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 300,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1DAA61',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  barText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 13, color: '#FFFFFF' },
  barHint: { fontFamily: fonts.medium, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
});
