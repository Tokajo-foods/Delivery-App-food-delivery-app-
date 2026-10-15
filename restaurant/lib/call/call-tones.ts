import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, Vibration } from 'react-native';

type AudioModule = typeof import('expo-audio');
type Player = ReturnType<AudioModule['createAudioPlayer']>;
type Tone = 'ringback' | 'ringtone';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RINGBACK = require('../../assets/sounds/ringback.wav');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RINGTONE = require('../../assets/sounds/incoming_call.wav');

let audio: AudioModule | null | undefined;
let player: Player | null = null;
let playing: Tone | null = null;

/** An older dev build has no ExpoAudio native module. Calls still work without tones. */
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

async function play(tone: Tone, earpiece: boolean): Promise<void> {
  if (playing === tone) return;
  await stopCallTones();
  if (tone === 'ringtone') Vibration.vibrate([0, 900, 1100], true);
  const mod = loadAudio();
  if (!mod) return;
  try {
    await mod.setAudioModeAsync({
      playsInSilentMode: tone === 'ringback',
      shouldRouteThroughEarpiece: earpiece,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: true,
    });
    const next = mod.createAudioPlayer(tone === 'ringback' ? RINGBACK : RINGTONE);
    next.loop = true;
    next.volume = tone === 'ringback' ? 0.7 : 1;
    next.play();
    player = next;
    playing = tone;
  } catch {
    player = null;
    playing = null;
  }
}

/** "Tring tring" the caller hears while the other phone rings. */
export function startRingback(earpiece: boolean): Promise<void> {
  return play('ringback', earpiece);
}

/** In-app ring when the OS call screen is not available (permission denied / old build). */
export function startRingtone(): Promise<void> {
  return play('ringtone', false);
}

export async function stopCallTones(): Promise<void> {
  Vibration.cancel();
  const current = player;
  player = null;
  playing = null;
  if (!current) return;
  try {
    current.pause();
    current.remove();
  } catch {
    // Player already released.
  }
}
