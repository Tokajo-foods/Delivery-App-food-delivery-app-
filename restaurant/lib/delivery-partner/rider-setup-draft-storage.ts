import type { RiderProfileForm } from '@/components/delivery/auth/register-wizard-form';
import { storageDeleteItem, storageGetItem, storageSetItem } from '@/lib/storage';

const KEY_PREFIX = 'rider_setup_draft_v1';

export type RiderSetupDraft = {
  step: number;
  form: RiderProfileForm;
  updatedAt: string;
};

function draftKey(userId: string): string {
  return `${KEY_PREFIX}:${userId.trim()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDraft(raw: string): RiderSetupDraft | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.form)) return null;
    const step = typeof parsed.step === 'number' ? parsed.step : 0;
    const form = parsed.form as RiderProfileForm;
    const updatedAt =
      typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString();
    return { step, form, updatedAt };
  } catch {
    return null;
  }
}

export async function loadRiderSetupDraft(userId: string | undefined): Promise<RiderSetupDraft | null> {
  const id = userId?.trim();
  if (!id) return null;
  const raw = await storageGetItem(draftKey(id));
  if (!raw) return null;
  return parseDraft(raw);
}

export async function saveRiderSetupDraft(
  userId: string | undefined,
  draft: RiderSetupDraft
): Promise<void> {
  const id = userId?.trim();
  if (!id) return;
  await storageSetItem(draftKey(id), JSON.stringify(draft));
}

export async function clearRiderSetupDraft(userId: string | undefined): Promise<void> {
  const id = userId?.trim();
  if (!id) return;
  await storageDeleteItem(draftKey(id));
}
