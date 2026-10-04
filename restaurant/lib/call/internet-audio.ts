import { Platform } from 'react-native';

type VoiceRoom = {
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  localParticipant: {
    setMicrophoneEnabled: (enabled: boolean) => Promise<unknown>;
  };
};

let active: VoiceRoom | null = null;
let registered = false;

const AUDIO_FAILED = 'In-app audio could not start. Use the phone number, or end this call.';

export async function connectVoice(url: string, token: string): Promise<void> {
  if (!url || !token) throw new Error(AUDIO_FAILED);
  await disconnectVoice();
  try {
    const Room = await loadRoom();
    const room = new Room();
    await room.connect(url, token);
    await room.localParticipant.setMicrophoneEnabled(true);
    active = room;
  } catch (err) {
    await disconnectVoice();
    const message = err instanceof Error ? err.message : '';
    if (/microphone|permission|denied/i.test(message)) {
      throw new Error('Allow microphone access to use an in-app call, or use the phone number.');
    }
    throw new Error(AUDIO_FAILED);
  }
}

export async function disconnectVoice(): Promise<void> {
  const room = active;
  active = null;
  if (!room) return;
  try {
    await room.disconnect();
  } catch {
    // The room is already closed.
  }
}

async function loadRoom(): Promise<new () => VoiceRoom> {
  if (Platform.OS !== 'web' && !registered) {
    const native = await import('@livekit/react-native');
    native.registerGlobals();
    registered = true;
  }
  const livekit = await import('livekit-client');
  return livekit.Room as new () => VoiceRoom;
}
