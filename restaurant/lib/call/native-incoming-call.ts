import { Platform } from 'react-native';

type KeepEvent = { callUUID?: string; muted?: boolean };
type InitialEvent = { name: string; data: KeepEvent };

type CallKeepModule = {
  setup: (options: Record<string, unknown>) => Promise<boolean>;
  displayIncomingCall: (
    uuid: string,
    handle: string,
    localizedCallerName?: string,
    handleType?: string,
    hasVideo?: boolean,
  ) => void;
  endCall: (uuid: string) => void;
  answerIncomingCall: (uuid: string) => void;
  rejectCall: (uuid: string) => void;
  reportEndCallWithUUID: (uuid: string, reason: number) => void;
  setAvailable: (enabled: boolean) => void;
  setCurrentCallActive: (uuid: string) => void;
  setMutedCall: (uuid: string, muted: boolean) => void;
  backToForeground: () => void;
  checkPhoneAccountEnabled?: () => Promise<boolean>;
  getInitialEvents?: () => Promise<InitialEvent[]>;
  clearInitialEvents?: () => void;
  addEventListener: (type: string, handler: (event: KeepEvent) => void) => void;
  removeEventListener: (type: string) => void;
};

/** CXCallEndedReason: the OS shows "missed" / "answered elsewhere" correctly. */
export const END_REASON = { failed: 1, remoteEnded: 2, unanswered: 3, answeredElsewhere: 4, declinedElsewhere: 5 } as const;

let keepModule: CallKeepModule | null | undefined;
let setupPromise: Promise<boolean> | null = null;

/** Reversible: a Mongo call id is 24 hex chars, CallKit needs a UUID string. */
export function callUuidFromId(callId: string): string {
  const hex = callId.replace(/[^a-f0-9]/gi, '').toLowerCase().padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function callIdFromUuid(uuid: string | undefined): string | null {
  if (!uuid) return null;
  const hex = uuid.replace(/-/g, '').toLowerCase();
  return /^[a-f0-9]{32}$/.test(hex) ? hex.slice(0, 24) : null;
}

function loadCallKeep(): CallKeepModule | null {
  if (keepModule !== undefined) return keepModule;
  if (Platform.OS === 'web') {
    keepModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('react-native-callkeep') as { default?: CallKeepModule } & CallKeepModule;
    const api = loaded.default ?? loaded;
    keepModule = typeof api?.setup === 'function' ? api : null;
  } catch {
    keepModule = null;
  }
  return keepModule;
}

export function setupNativeIncomingCalls(): Promise<boolean> {
  if (setupPromise) return setupPromise;
  const keep = loadCallKeep();
  if (!keep) return Promise.resolve(false);
  setupPromise = keep
    .setup({
      ios: {
        appName: 'TOKAJO',
        supportsVideo: false,
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1',
        includesCallsInRecents: false,
        ringtoneSound: 'incoming_call.wav',
      },
      android: {
        alertTitle: 'Allow order calls',
        alertDescription:
          'TOKAJO shows order calls on the lock screen like a normal phone call. Your personal number stays private.',
        cancelButton: 'Not now',
        okButton: 'Allow',
        additionalPermissions: [],
        foregroundService: {
          channelId: 'tokajo-calls',
          channelName: 'Incoming calls',
          notificationTitle: 'TOKAJO call in progress',
          notificationIcon: 'ic_launcher',
        },
      },
    })
    .then(() => {
      keep.setAvailable(true);
      return true;
    })
    .catch(() => {
      setupPromise = null;
      return false;
    });
  return setupPromise;
}

/** A headless wake cannot show CallKeep's permission alert, so setup may never settle. */
function withTimeout<T>(work: Promise<T>, fallback: T, ms = 4000): Promise<T> {
  return Promise.race([work, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

/** System incoming-call screen with the phone's own ringtone. False → caller shows the ringing notification. */
export async function displayNativeIncomingCall(callId: string, callerName: string): Promise<boolean> {
  if (!(await withTimeout(setupNativeIncomingCalls(), false))) return false;
  const keep = loadCallKeep();
  if (!keep) return false;
  if (Platform.OS === 'android' && keep.checkPhoneAccountEnabled) {
    const enabled = await withTimeout(keep.checkPhoneAccountEnabled().catch(() => false), false);
    if (!enabled) return false;
  }
  try {
    keep.displayIncomingCall(callUuidFromId(callId), 'TOKAJO', callerName, 'generic', false);
    return true;
  } catch {
    return false;
  }
}

/** We hung up / declined here. */
export function endNativeCall(callId: string): void {
  const keep = loadCallKeep();
  if (!keep) return;
  try {
    keep.endCall(callUuidFromId(callId));
  } catch {
    // Already gone.
  }
}

/** The other side or another device ended it. */
export function reportNativeCallEnded(callId: string, reason: number): void {
  const keep = loadCallKeep();
  if (!keep) return;
  try {
    keep.reportEndCallWithUUID(callUuidFromId(callId), reason);
  } catch {
    endNativeCall(callId);
  }
}

/** Answered in the app while CallKit was ringing: move the OS call to answered too. */
export function answerNativeCall(callId: string): void {
  const keep = loadCallKeep();
  if (!keep) return;
  try {
    keep.answerIncomingCall(callUuidFromId(callId));
  } catch {
    // The OS call is already gone.
  }
}

export function markNativeCallActive(callId: string): void {
  const keep = loadCallKeep();
  if (!keep) return;
  try {
    keep.setCurrentCallActive(callUuidFromId(callId));
  } catch {
    // Optional on some OS versions.
  }
}

export function setNativeCallMuted(callId: string, muted: boolean): void {
  const keep = loadCallKeep();
  if (!keep) return;
  try {
    keep.setMutedCall(callUuidFromId(callId), muted);
  } catch {
    // Optional.
  }
}

export function bringAppToForeground(): void {
  const keep = loadCallKeep();
  if (!keep) return;
  try {
    keep.backToForeground();
  } catch {
    // iOS opens the app itself after answer.
  }
}

type NativeHandlers = {
  onAnswer: (callId: string) => void;
  onEnd: (callId: string) => void;
  onMute: (callId: string, muted: boolean) => void;
};

let bound = false;

/** Once per JS runtime, so a headless wake and the UI share one listener set. */
export async function bindNativeCallActions(handlers: NativeHandlers): Promise<void> {
  if (bound) return;
  const keep = loadCallKeep();
  if (!keep || !(await setupNativeIncomingCalls())) return;
  bound = true;
  const route = (name: string, event: KeepEvent) => {
    const callId = callIdFromUuid(event.callUUID);
    if (!callId) return;
    if (name === 'answerCall' || name === 'RNCallKeepPerformAnswerCallAction') handlers.onAnswer(callId);
    else if (name === 'endCall' || name === 'RNCallKeepPerformEndCallAction') handlers.onEnd(callId);
    else if (name === 'didPerformSetMutedCallAction' || name === 'RNCallKeepDidPerformSetMutedCallAction') {
      handlers.onMute(callId, Boolean(event.muted));
    }
  };
  keep.addEventListener('answerCall', (e) => route('answerCall', e));
  keep.addEventListener('endCall', (e) => route('endCall', e));
  keep.addEventListener('didPerformSetMutedCallAction', (e) => route('didPerformSetMutedCallAction', e));
  try {
    const initial = (await keep.getInitialEvents?.()) ?? [];
    initial.forEach((event) => route(event.name, event.data ?? {}));
    keep.clearInitialEvents?.();
  } catch {
    // Older CallKeep has no initial events.
  }
}
