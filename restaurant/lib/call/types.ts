export const DISCLOSURE =
  'The other participant will see a Tokajo-provided number rather than your personal mobile number.';

export type CallRole = 'customer' | 'restaurant' | 'rider';
export type ViewerKind = CallRole;

export type CallMask = {
  pairId: string;
  virtualNumber: string;
  role: CallRole;
  allocationStatus: 'active';
  expiresAt: string | null;
  methods: Array<'cellular' | 'internet'>;
};

export type InternetChoice = {
  pairKey: string;
  role: CallRole;
  available: boolean;
};

export type OrderMasks = {
  orderId: string;
  disclosure: string;
  masks: CallMask[];
  internet: InternetChoice[];
};

export type InternetCallSession = {
  callId: string;
  orderId: string;
  pairKey: string;
  state: string;
  callerRole: string;
  calleeRole: string;
  roomName?: string | null;
  livekitUrl?: string | null;
  token?: string | null;
};

export type LiveCall = {
  callId: string;
  state: string;
  direction: 'out' | 'in';
  role: CallRole;
  callerRole: string;
  calleeRole: string;
};

export type CallRow = {
  role: CallRole;
  label: string;
  virtualNumber: string | null;
  internetAvailable: boolean;
};

const ROLES: CallRole[] = ['customer', 'restaurant', 'rider'];

export function isCallRole(value: string): value is CallRole {
  return (ROLES as string[]).includes(value);
}

export function pairKeyFor(viewer: ViewerKind, role: CallRole): string | null {
  if (viewer === 'customer' && role === 'restaurant') return 'customer_restaurant';
  if (viewer === 'restaurant' && role === 'customer') return 'customer_restaurant';
  if (viewer === 'customer' && role === 'rider') return 'customer_rider';
  if (viewer === 'rider' && role === 'customer') return 'customer_rider';
  if (viewer === 'rider' && role === 'restaurant') return 'rider_restaurant';
  if (viewer === 'restaurant' && role === 'rider') return 'rider_restaurant';
  return null;
}
