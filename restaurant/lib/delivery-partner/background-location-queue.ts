import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  dropExpired,
  pushFix,
  type QueuedFix,
} from '@/lib/delivery-partner/background-location-policy';

const KEY = 'tokajo.trip-location-queue';

export async function readFixQueue(): Promise<QueuedFix[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QueuedFix[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeFixQueue(queue: readonly QueuedFix[]): Promise<void> {
  if (!queue.length) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

export async function enqueueFix(fix: QueuedFix): Promise<QueuedFix[]> {
  const next = pushFix(await readFixQueue(), fix);
  await writeFixQueue(next);
  return next;
}

export async function takeSendableFixes(now: number): Promise<QueuedFix[]> {
  const kept = dropExpired(await readFixQueue(), now);
  await writeFixQueue(kept);
  return kept;
}

export async function clearFixQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
