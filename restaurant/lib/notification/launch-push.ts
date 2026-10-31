import { storageGetItem, storageSetItem } from '@/lib/storage';

const HANDLED_KEY = 'handled_push_response_id';

let openedFromPushThisSession = false;
let settled = false;
const waiters: Array<(opened: boolean) => void> = [];

function finishSettle(opened: boolean) {
  openedFromPushThisSession = openedFromPushThisSession || opened;
  if (settled) return;
  settled = true;
  waiters.splice(0).forEach((fn) => fn(openedFromPushThisSession));
}

/** True if this process already opened a screen from a notification tap. */
export function didOpenFromPushThisSession(): boolean {
  return openedFromPushThisSession;
}

export function waitForLaunchPush(ms = 900): Promise<boolean> {
  if (settled) return Promise.resolve(openedFromPushThisSession);
  return Promise.race([
    new Promise<boolean>((resolve) => waiters.push(resolve)),
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        finishSettle(false);
        resolve(openedFromPushThisSession);
      }, ms);
    }),
  ]);
}

/** Claim a tap once across launches so icon opens do not replay the last notification. */
export async function claimPushResponse(id: string): Promise<boolean> {
  const previous = await storageGetItem(HANDLED_KEY);
  if (previous === id) return false;
  await storageSetItem(HANDLED_KEY, id);
  openedFromPushThisSession = true;
  return true;
}

export function markLaunchPushSettled(opened = false): void {
  finishSettle(opened);
}
