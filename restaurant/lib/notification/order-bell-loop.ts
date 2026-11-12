import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, Vibration } from 'react-native';

type AudioModule = typeof import('expo-audio');
type Player = ReturnType<AudioModule['createAudioPlayer']>;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ORDER_BELL = require('../../assets/sounds/order_bell.wav');

const BELL_MS = 1_100;
const GAP_MS = 280;
/** Hard cap: at most this many chimes per `playOrderBellBurst` call (2–3). */
export const ORDER_BELL_BURST_PLAYS = 3;
const DEFAULT_BURST = ORDER_BELL_BURST_PLAYS;

let audio: AudioModule | null | undefined;
let player: Player | null = null;
let burstGeneration = 0;
let bursting = false;

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isOrderBellRinging(): boolean {
  return bursting || player != null;
}

/** Stops any in-progress burst or legacy loop. */
export function stopOrderBell(): void {
  burstGeneration += 1;
  bursting = false;
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

/** Play the order bell a few times when a new ticket arrives (no endless loop). */
export async function playOrderBellBurst(times = DEFAULT_BURST): Promise<void> {
  if (Platform.OS === 'web') return;
  if (bursting) return;
  const plays = Math.min(ORDER_BELL_BURST_PLAYS, Math.max(1, Math.round(times)));
  const gen = ++burstGeneration;
  Vibration.cancel();
  const prev = player;
  player = null;
  bursting = false;
  if (prev) {
    try {
      prev.pause();
      prev.remove();
    } catch {
      // ignore
    }
  }
  bursting = true;

  const vibe = [0, ...Array.from({ length: plays }, () => [350, GAP_MS]).flat()];
  Vibration.vibrate(vibe);

  const mod = loadAudio();
  if (!mod) {
    bursting = false;
    return;
  }

  try {
    await mod.setAudioModeAsync({
      playsInSilentMode: true,
      shouldRouteThroughEarpiece: false,
      interruptionMode: 'duckOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
    });

    for (let i = 0; i < plays; i += 1) {
      if (gen !== burstGeneration) break;
      const next = mod.createAudioPlayer(ORDER_BELL);
      next.loop = false;
      next.volume = 1;
      next.play();
      player = next;
      await sleep(BELL_MS);
      if (gen !== burstGeneration) break;
      try {
        next.pause();
        next.remove();
      } catch {
        // ignore
      }
      player = null;
      if (i < plays - 1) await sleep(GAP_MS);
    }
  } catch {
    // Audio unavailable.
  } finally {
    if (gen === burstGeneration) {
      bursting = false;
      player = null;
    }
  }
}

/** @deprecated Use `playOrderBellBurst` — kept for call sites that still import this name. */
export async function startOrderBell(): Promise<void> {
  await playOrderBellBurst(DEFAULT_BURST);
}
