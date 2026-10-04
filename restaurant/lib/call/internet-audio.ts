import { AppState, PermissionsAndroid, Platform } from 'react-native';

type VoiceRoom = {
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  localParticipant: {
    setMicrophoneEnabled: (enabled: boolean) => Promise<unknown>;
  };
};

let active: VoiceRoom | null = null;
let activeToken: string | null = null;
let registered = false;
let connecting: Promise<void> | null = null;
let appStateSub: { remove: () => void } | null = null;

const AUDIO_FAILED = 'In-app audio could not start. Use the phone number, or end this call.';
const MIC_DENIED = 'Allow microphone access to use an in-app call, or use the phone number.';

async function registerNative(): Promise<void> {
  if (Platform.OS === 'web' || registered) return;
  const native = await import('@livekit/react-native');
  native.registerGlobals();
  registered = true;
}

/** Android and iOS both prompt before the other person is rung. */
export async function ensureMicrophone(): Promise<void> {
  if (Platform.OS === 'web') return;
  await registerNative();
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (!granted) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: 'Microphone for in-app calls',
        message: 'TOKAJO uses the microphone only during an in-app order call. Your mobile number stays hidden.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      });
      if (result !== PermissionsAndroid.RESULTS.GRANTED) throw new Error(MIC_DENIED);
    }
    return;
  }
  const webrtc = await import('@livekit/react-native-webrtc');
  const result: unknown = await webrtc.permissions.request({ name: 'microphone' });
  const status = result && typeof result === 'object' && 'status' in result
    ? String((result as { status: unknown }).status)
    : String(result);
  if (result !== true && status !== 'granted') throw new Error(MIC_DENIED);
}

async function startSession(): Promise<void> {
  if (Platform.OS === 'web') return;
  const native = await import('@livekit/react-native');
  await native.AudioSession.configureAudio({
    android: {
      preferredOutputList: ['bluetooth', 'headset', 'speaker', 'earpiece'],
      audioTypeOptions: native.AndroidAudioTypePresets.communication,
    },
    ios: { defaultOutput: 'speaker' },
  });
  await native.AudioSession.startAudioSession();
  await native.AudioSession.setAppleAudioConfiguration({
    audioCategory: 'playAndRecord',
    audioCategoryOptions: ['allowBluetooth', 'defaultToSpeaker'],
    audioMode: 'voiceChat',
  });
}

function watchForeground(): void {
  if (appStateSub) return;
  appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'active' && active) void startSession();
  });
}

export async function connectVoice(url: string, token: string): Promise<void> {
  if (!url || !token) throw new Error(AUDIO_FAILED);
  if (active && activeToken === token) return;
  if (connecting) return connecting;
  connecting = openRoom(url, token).finally(() => {
    connecting = null;
  });
  return connecting;
}

async function openRoom(url: string, token: string): Promise<void> {
  await ensureMicrophone();
  await disconnectVoice();
  try {
    await startSession();
    const Room = await loadRoom();
    const room = new Room();
    await room.connect(url, token);
    await room.localParticipant.setMicrophoneEnabled(true);
    active = room;
    activeToken = token;
    watchForeground();
  } catch (err) {
    await disconnectVoice();
    const message = err instanceof Error ? err.message : '';
    if (/microphone|permission|denied/i.test(message)) throw new Error(MIC_DENIED);
    throw new Error(AUDIO_FAILED);
  }
}

export async function setVoiceMuted(muted: boolean): Promise<void> {
  if (!active) return;
  await active.localParticipant.setMicrophoneEnabled(!muted);
}

export async function disconnectVoice(): Promise<void> {
  const room = active;
  active = null;
  activeToken = null;
  appStateSub?.remove();
  appStateSub = null;
  if (room) {
    try {
      await room.disconnect();
    } catch {
      // The room is already closed.
    }
  }
  if (Platform.OS === 'web') return;
  try {
    const native = await import('@livekit/react-native');
    await native.AudioSession.stopAudioSession();
  } catch {
    // The audio session was never started.
  }
}

async function loadRoom(): Promise<new () => VoiceRoom> {
  await registerNative();
  const livekit = await import('livekit-client');
  return livekit.Room as new () => VoiceRoom;
}
