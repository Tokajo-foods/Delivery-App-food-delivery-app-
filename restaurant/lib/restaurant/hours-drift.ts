import type { DayKey, RestaurantTimings, TimeSlot } from '@/lib/restaurant/settings-types';
import { WEEK_DAYS } from '@/lib/restaurant/settings-types';
import type { HolidayRow, SpecialHoursDay } from '@/lib/restaurant/types';

const WEEKDAY_KEY: Record<string, DayKey> = {
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
  Sat: 'saturday',
  Sun: 'sunday',
};

export type HoursDriftKind = 'early' | 'late' | 'closed';

export type HoursDrift = {
  kind: HoursDriftKind;
  dayKey: DayKey;
  dayLabel: string;
  date: string;
  slots: TimeSlot[];
  slotIndex: number;
  /** Suggested open after the owner confirms. */
  open: string;
  /** Suggested close after the owner confirms. */
  close: string;
  scheduledOpen: string | null;
  scheduledClose: string | null;
  /** Today is a holiday or one-day override, so that calendar must move with the week. */
  syncSpecialToday: boolean;
};

type IstClock = {
  dayKey: DayKey;
  date: string;
  minutes: number;
  hhmm: string;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function minutesToHhmm(total: number): string {
  const capped = Math.max(0, Math.min(total, 23 * 60 + 59));
  const hours = Math.floor(capped / 60);
  const minutes = capped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function isWithinSlot(currentMinutes: number, slot: TimeSlot): boolean {
  const open = timeToMinutes(slot.open);
  const close = timeToMinutes(slot.close);
  if (close < open) {
    return currentMinutes >= open || currentMinutes <= close;
  }
  return currentMinutes >= open && currentMinutes <= close;
}

export function istClock(now = new Date()): IstClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  let hour = pick('hour');
  if (hour === '24') hour = '00';
  const minute = pick('minute').padStart(2, '0');
  hour = hour.padStart(2, '0');
  return {
    dayKey: WEEKDAY_KEY[pick('weekday')] ?? 'monday',
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    minutes: Number(hour) * 60 + Number(minute),
    hhmm: `${hour}:${minute}`,
  };
}

export function formatHoursClock(hhmm: string): string {
  const [hourRaw, minuteRaw] = hhmm.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return hhmm;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function closedWindow(nowHhmm: string): { open: string; close: string } {
  const close = minutesToHhmm(timeToMinutes(nowHhmm) + 4 * 60);
  if (close === nowHhmm) return { open: '23:00', close: '23:59' };
  return { open: nowHhmm, close };
}

function nearestOutsideSlot(
  slots: TimeSlot[],
  minutes: number,
): { kind: 'early' | 'late'; slotIndex: number } | null {
  let best: { kind: 'early' | 'late'; slotIndex: number; distance: number } | null =
    null;
  const consider = (
    kind: 'early' | 'late',
    slotIndex: number,
    distance: number,
  ) => {
    if (distance < 0) return;
    if (!best || distance < best.distance) best = { kind, slotIndex, distance };
  };

  slots.forEach((slot, slotIndex) => {
    const open = timeToMinutes(slot.open);
    const close = timeToMinutes(slot.close);
    if (close >= open) {
      if (minutes < open) consider('early', slotIndex, open - minutes);
      if (minutes > close) consider('late', slotIndex, minutes - close);
      return;
    }
    if (minutes > close && minutes < open) {
      consider('late', slotIndex, minutes - close);
      consider('early', slotIndex, open - minutes);
    }
  });

  const found = best as { kind: 'early' | 'late'; slotIndex: number } | null;
  return found ? { kind: found.kind, slotIndex: found.slotIndex } : null;
}

export function detectHoursDrift(input: {
  week?: RestaurantTimings | null;
  holidays?: HolidayRow[];
  specialDays?: SpecialHoursDay[];
  now?: Date;
}): HoursDrift | null {
  if (!input.week) return null;
  const clock = istClock(input.now);
  const dayLabel =
    WEEK_DAYS.find((day) => day.key === clock.dayKey)?.label ?? 'Today';
  const holiday = (input.holidays ?? []).some((row) => row.date === clock.date);
  const special = (input.specialDays ?? []).find((row) => row.date === clock.date);
  const weekly = input.week[clock.dayKey];

  let slots: TimeSlot[] = [];
  let syncSpecialToday = false;
  if (holiday) {
    syncSpecialToday = true;
  } else if (special) {
    syncSpecialToday = true;
    if (special.isOpen && special.slots.length) slots = special.slots.slice(0, 3);
  } else if (weekly?.isOpen && weekly.slots.length) {
    slots = weekly.slots.slice(0, 3);
  }

  if (!slots.length) {
    const window = closedWindow(clock.hhmm);
    return {
      kind: 'closed',
      dayKey: clock.dayKey,
      dayLabel,
      date: clock.date,
      slots: [],
      slotIndex: 0,
      open: window.open,
      close: window.close,
      scheduledOpen: null,
      scheduledClose: null,
      syncSpecialToday,
    };
  }

  if (slots.some((slot) => isWithinSlot(clock.minutes, slot))) return null;

  const nearest = nearestOutsideSlot(slots, clock.minutes);
  if (!nearest) return null;
  const slot = slots[nearest.slotIndex];
  if (!slot) return null;

  return {
    kind: nearest.kind,
    dayKey: clock.dayKey,
    dayLabel,
    date: clock.date,
    slots,
    slotIndex: nearest.slotIndex,
    open: nearest.kind === 'early' ? clock.hhmm : slot.open,
    close: nearest.kind === 'late' ? clock.hhmm : slot.close,
    scheduledOpen: slot.open,
    scheduledClose: slot.close,
    syncSpecialToday,
  };
}

export function slotsAfterDriftEdit(
  drift: HoursDrift,
  open: string,
  close: string,
): TimeSlot[] {
  if (!drift.slots.length) return [{ open, close }];
  return drift.slots.map((slot, index) =>
    index === drift.slotIndex ? { open, close } : { ...slot },
  );
}
