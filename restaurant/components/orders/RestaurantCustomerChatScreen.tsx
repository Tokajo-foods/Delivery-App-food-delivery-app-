import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { api } from '@/lib/api';
import { useOrderCalls } from '@/lib/call/use-order-calls';
import { seedKitchenChat, sendKitchenTyping } from '@/lib/gateway/kitchen-client';
import { useKitchenOrderChat } from '@/lib/gateway/kitchen-socket';

type Row = {
  id: string;
  text: string;
  fromRole?: string;
  to?: string;
  createdAt: string;
};

function isCustomerThread(row: { fromRole?: string; to?: string }) {
  if (row.to === 'partner' || row.fromRole === 'partner') return false;
  if (row.fromRole === 'restaurant') return row.to !== 'partner';
  return row.fromRole === 'customer';
}

export function RestaurantCustomerChatScreen() {
  const { orderId, customerName } = useLocalSearchParams<{
    orderId: string;
    customerName?: string;
  }>();
  const id = String(orderId ?? '');
  const title = String(customerName ?? '').trim() || 'Customer';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const chat = useKitchenOrderChat(id, Boolean(id));
  const calls = useOrderCalls(id, 'restaurant');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void api.get(`/api/v1/delivery-service/tracking/order/${encodeURIComponent(id)}/chat`, {
      params: { limit: 100 },
    }).then((res) => {
      if (!alive) return;
      const body = res.data as { data?: { messages?: Row[] }; messages?: Row[] };
      const messages = body.data?.messages ?? body.messages ?? [];
      seedKitchenChat(id, messages.map((row) => ({
        id: String(row.id),
        orderId: id,
        text: String(row.text ?? ''),
        fromRole: row.fromRole ?? (row as { senderRole?: string }).senderRole,
        to: row.to,
        createdAt: row.createdAt || new Date().toISOString(),
      })).filter((row) => row.text));
    }).catch(() => {
      if (alive) setError('Could not load earlier messages. New ones will still appear.');
    });
    return () => {
      alive = false;
      sendKitchenTyping(id, false);
    };
  }, [id]);

  const thread = chat.messages.filter(isCustomerThread);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [thread.length, chat.peerTyping]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    chat.setTyping(false);
    try {
      await chat.send(text, 'customer');
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that message.');
    } finally {
      setSending(false);
    }
  };

  const incoming = calls.live?.direction === 'in' && calls.live.state === 'ringing';

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft color={authTheme.text} size={22} />
        </Pressable>
        <View style={styles.avatar}><Text style={styles.avatarText}>{title.slice(0, 1).toUpperCase()}</Text></View>
        <View style={styles.headerCopy}>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          <Text style={styles.presence}>{chat.peerTyping ? 'typing…' : 'Customer'}</Text>
        </View>
        <Pressable onPress={() => setCallOpen(true)} style={styles.iconBtn} hitSlop={8}>
          <Phone color={authTheme.brand} size={20} />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {calls.live ? (
        <View style={styles.live}>
          <Text style={styles.liveText}>
            {incoming ? `${title} is calling` : calls.live.state === 'accepted' ? 'On a call' : 'Calling…'}
          </Text>
          {incoming ? (
            <Pressable onPress={() => void calls.accept()}><Text style={styles.liveAction}>Accept</Text></Pressable>
          ) : (
            <Pressable onPress={() => void calls.hangup()}><Text style={styles.liveAction}>End</Text></Pressable>
          )}
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.thread}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {thread.length === 0 ? (
          <Text style={styles.empty}>Messages with {title} show here as they arrive.</Text>
        ) : null}
        {thread.map((row) => {
          const mine = row.fromRole === 'restaurant';
          return (
            <View key={row.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={[styles.body, mine && styles.bodyMine]}>{row.text}</Text>
              <Text style={[styles.time, mine && styles.timeMine]}>
                {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          value={draft}
          onChangeText={(value) => {
            setDraft(value);
            chat.setTyping(Boolean(value.trim()));
          }}
          placeholder="Message"
          placeholderTextColor={authTheme.textDim}
          style={styles.input}
          multiline
        />
        <Pressable onPress={() => void send()} disabled={!draft.trim() || sending} style={styles.send}>
          {sending ? <ActivityIndicator color="#FFFFFF" /> : <Send color="#FFFFFF" size={18} />}
        </Pressable>
      </View>

      <Modal visible={callOpen} transparent animationType="fade" onRequestClose={() => setCallOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCallOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>Call {title}</Text>
            <Text style={styles.sheetSub}>Your number stays hidden.</Text>
            {calls.notice ? <Text style={styles.error}>{calls.notice}</Text> : null}
            <Pressable
              style={styles.choice}
              onPress={() => {
                setCallOpen(false);
                void calls.dial('customer');
              }}
            >
              <Text style={styles.choiceText}>Normal call</Text>
            </Pressable>
            <Pressable
              style={styles.choice}
              onPress={() => {
                setCallOpen(false);
                void calls.startInternet('customer');
              }}
            >
              <Text style={styles.choiceText}>Internet call</Text>
            </Pressable>
            <Pressable onPress={() => setCallOpen(false)} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F6F1EC' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingBottom: 12, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F0E6DE',
  },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: authTheme.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 16 },
  headerCopy: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: authTheme.text },
  presence: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12, color: authTheme.textMuted },
  error: { marginHorizontal: 14, marginTop: 8, color: '#B91C1C', fontFamily: fonts.regular, fontSize: 13 },
  live: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    margin: 12, padding: 12, borderRadius: 12, backgroundColor: '#111827',
  },
  liveText: { color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 14 },
  liveAction: { color: '#FFB088', fontFamily: fonts.bold, fontSize: 14 },
  thread: { padding: 14, gap: 8, flexGrow: 1 },
  empty: {
    alignSelf: 'center', marginTop: 24, color: authTheme.textMuted,
    fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', maxWidth: 260,
  },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: authTheme.brand, borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4 },
  body: { fontFamily: fonts.regular, fontSize: 15, color: authTheme.text, lineHeight: 20 },
  bodyMine: { color: '#FFFFFF' },
  time: { marginTop: 4, fontFamily: fonts.regular, fontSize: 10, color: '#9CA3AF', alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.8)' },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingTop: 8, backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1, maxHeight: 120, minHeight: 44, borderRadius: 22,
    backgroundColor: '#F6F1EC', paddingHorizontal: 16, paddingVertical: 10,
    fontFamily: fonts.regular, fontSize: 15, color: authTheme.text,
  },
  send: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: authTheme.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 18, paddingBottom: 28,
  },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 18, color: authTheme.text },
  sheetSub: { marginTop: 4, marginBottom: 14, fontFamily: fonts.regular, fontSize: 13, color: authTheme.textMuted },
  choice: {
    borderRadius: 14, backgroundColor: '#FFF1E8', paddingVertical: 14, alignItems: 'center', marginBottom: 8,
  },
  choiceText: { fontFamily: fonts.bold, fontSize: 15, color: authTheme.brand },
  cancel: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontFamily: fonts.medium, fontSize: 15, color: authTheme.textMuted },
});
