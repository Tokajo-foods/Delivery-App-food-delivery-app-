import { Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
import { useCallStore } from '@/lib/call/call-store';
import { useCallSync } from '@/lib/call/use-call-sync';
import { useAuthStore } from '@/store/auth-store';

type Props = { viewer: 'restaurant' | 'rider' };

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
  const [, tick] = useState(0);

  useEffect(() => setMinimized(false), [call?.callId]);

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

  const fullScreen = Boolean(call) && !minimized && !(call?.phase === 'incoming' && call.nativeRinging);
  const elapsed = call?.connectedAt ? Math.floor((Date.now() - call.connectedAt) / 1000) : 0;

  return (
    <>
      {notice && !fullScreen ? (
        <View style={[styles.toast, { top: insets.top + 8 }]} pointerEvents="none">
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      ) : null}
      {call && minimized ? (
        <Pressable style={[styles.bar, { top: insets.top + 6 }]} onPress={() => setMinimized(false)}>
          <Phone color="#FFFFFF" size={14} />
          <Text style={styles.barText} numberOfLines={1}>
            {call.peerName} · {call.phase === 'active' ? formatCallDuration(elapsed) : 'Ringing…'} · tap to return
          </Text>
        </Pressable>
      ) : null}
      <Modal
        visible={fullScreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (call && call.phase !== 'incoming') setMinimized(true);
        }}
      >
        {call ? (
          <CallScreen
            call={call}
            muted={muted}
            speaker={speaker}
            busy={busy}
            onAccept={() => void acceptCall(call.callId)}
            onDecline={() => void declineCall(call.callId)}
            onHangup={() => void hangupCall()}
            onToggleMute={() => void setMuted(!muted)}
            onToggleSpeaker={() => void setSpeaker(!speaker)}
            onMinimize={() => setMinimized(true)}
          />
        ) : null}
        {notice ? (
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
});
