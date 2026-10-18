import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, Vibration } from 'react-native';

type AudioModule = typeof import('expo-audio');
type Player = ReturnType<AudioModule['createAudioPlayer']>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ORDER_BELL = require('../../assets/sounds/order_bell.wav');

let audio: AudioModule | null | undefined;
let player: Player | null = null;

function loadAudio(): AudioModule | null {
  if (audio !== undefined) return audio;
  if (Platform.OS === 'web' || !requireOptionalNativeModule('ExpoAudio')) {
    audio = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    audio = require('expo-audio') as AudioModule;
  } catch {
    audio = null;
  }
  return audio;
}

export function isOrderBellRinging(): boolean {
  return player != null;
}

/** Loops the order bell (rings through the iPhone silent switch) until `stopOrderBell`. */
export async function startOrderBell(): Promise<void> {
  if (player) return;
  Vibration.vibrate([0, 600, 900], true);
  const mod = loadAudio();
  if (!mod) return;
  try {
    await mod.setAudioModeAsync({
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'duckOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
    });
    const next = mod.createAudioPlayer(ORDER_BELL);
    next.loop = true;
    next.volume = 1;
    next.play();
    player = next;
  } catch {
    player = null;
  }
}

export function stopOrderBell(): void {
  Vibration.cancel();
  const current = player;
  player = null;
  if (!current) return;
  try {
    current.pause();
    current.remove();
  } catch {
    // Player already released.
  }
}
