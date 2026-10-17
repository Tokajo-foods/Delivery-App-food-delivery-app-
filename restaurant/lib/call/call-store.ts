import { create } from 'zustand';

import type { CallRole } from '@/lib/call/types';

/** outgoing = we dialled and it rings · incoming = it rings here · active = both sides joined */
export type CallPhase = 'outgoing' | 'incoming' | 'connecting' | 'active';

export type ActiveCall = {
  callId: string;
  orderId: string;
  phase: CallPhase;
  direction: 'in' | 'out';
  peerRole: CallRole;
  peerName: string;
  peerLogoUrl: string | null;
  orderNumber: string | null;
  callerRole: string;
  calleeRole: string;
  remoteState: string;
  connectedAt: number | null;
  /** The OS call screen (CallKit / ConnectionService) owns the ring. */
  nativeRinging: boolean;
  reconnecting?: boolean;
};

type CallStore = {
  call: ActiveCall | null;
  busy: string | null;
  muted: boolean;
  speaker: boolean;
  notice: string | null;
  set: (patch: Partial<Omit<CallStore, 'set' | 'patchCall'>>) => void;
  patchCall: (callId: string, patch: Partial<ActiveCall>) => void;
};

export const useCallStore = create<CallStore>((set) => ({
  call: null,
  busy: null,
  muted: false,
  speaker: false,
  notice: null,
  set: (patch) => set(patch),
  patchCall: (callId, patch) =>
    set((state) => (state.call?.callId === callId ? { call: { ...state.call, ...patch } } : state)),
}));

export function getCall(): ActiveCall | null {
  return useCallStore.getState().call;
}

const ROLE_LABEL: Record<CallRole, string> = {
  customer: 'Customer',
  restaurant: 'Restaurant',
  rider: 'Delivery partner',
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role as CallRole] ?? 'Tokajo';
}

export function peerSubtitle(call: Pick<ActiveCall, 'peerRole' | 'orderNumber'>): string {
  const label = roleLabel(call.peerRole);
  return call.orderNumber ? `${label} · Order #${call.orderNumber}` : label;
}
