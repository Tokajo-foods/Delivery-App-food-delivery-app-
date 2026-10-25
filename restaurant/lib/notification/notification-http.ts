import axios from 'axios';

import { api } from '@/lib/api';
import type { AppNotification, PaginationMeta } from '@/lib/notification/types';

/** Shared HTTP envelope + DTO mappers for the notification clients. */

export type Envelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
};

export async function request<T>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
  } = {}
): Promise<Envelope<T>> {
  const { method = 'GET', body } = options;
  const isMutating = method !== 'GET';

  try {
    const response = await api.request<Envelope<T> | T>({
      url: path,
      method,
      data: isMutating ? (body ?? {}) : body,
      headers: isMutating
        ? {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }
        : { Accept: 'application/json' },
    });

    const payload = response.data as Envelope<T> | T;
    if (
      payload &&
      typeof payload === 'object' &&
      ('data' in (payload as object) || 'success' in (payload as object))
    ) {
      return payload as Envelope<T>;
    }

    return { success: true, data: payload as T };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (!error.response) {
        throw new Error(
          'Network request failed. Check your internet connection and try again.'
        );
      }

      const data = error.response.data as
        | { message?: string; error?: string }
        | undefined;
      const message =
        data?.message ||
        data?.error ||
        `Request failed (${error.response.status})`;

      if (message.toLowerCase().includes('csrf')) {
        throw new Error(
          'Security token expired. Close and reopen the app, then try again.'
        );
      }

      throw new Error(message);
    }

    throw error;
  }
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

export function extractList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (!data || typeof data !== 'object') return [];
  const record = data as Record<string, unknown>;
  const nested =
    record.notifications ??
    record.items ??
    record.results ??
    record.docs ??
    record.list ??
    record.data ??
    [];
  if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  if (nested && typeof nested === 'object') return extractList(nested);
  return [];
}

export function mapNotification(raw: Record<string, unknown>): AppNotification {
  const nestedData =
    raw.data && typeof raw.data === 'object'
      ? (raw.data as Record<string, unknown>)
      : undefined;

  const isReadRaw = raw.isRead ?? raw.read ?? raw.is_read ?? raw.seen;
  const isRead =
    typeof isReadRaw === 'boolean'
      ? isReadRaw
      : String(isReadRaw ?? '').toLowerCase() === 'true' ||
        String(raw.status ?? '').toLowerCase() === 'read';

  return {
    id: String(raw.notificationId ?? raw._id ?? raw.id ?? ''),
    title: String(raw.title ?? raw.subject ?? 'Notification'),
    body: String(
      raw.body ?? raw.message ?? raw.content ?? raw.description ?? ''
    ),
    type: String(raw.type ?? raw.category ?? 'system'),
    isRead,
    createdAt:
      (raw.createdAt as string) ||
      (raw.created_at as string) ||
      (raw.timestamp as string) ||
      undefined,
    data: nestedData ?? (raw.payload as Record<string, unknown> | undefined),
    imageUrl:
      (raw.imageUrl as string) ||
      (raw.image as string) ||
      (raw.iconUrl as string) ||
      undefined,
  };
}

export function mapUnreadCount(data: unknown): number {
  if (typeof data === 'number') return data;
  const record = asRecord(data);
  const count =
    record.count ??
    record.unreadCount ??
    record.unread ??
    record.totalUnread ??
    record.total;
  return typeof count === 'number' ? count : Number(count) || 0;
}

export function mapMeta(raw: unknown): PaginationMeta | undefined {
  const record = asRecord(raw);
  if (!Object.keys(record).length) return undefined;
  const total = Number(record.total ?? record.totalCount ?? record.count);
  const page = Number(record.page ?? record.currentPage);
  const limit = Number(record.limit ?? record.perPage);
  const totalPages = Number(record.totalPages ?? record.pages);
  return {
    total: Number.isFinite(total) ? total : undefined,
    page: Number.isFinite(page) ? page : undefined,
    limit: Number.isFinite(limit) ? limit : undefined,
    totalPages: Number.isFinite(totalPages) ? totalPages : undefined,
    hasNext:
      typeof record.hasNext === 'boolean'
        ? record.hasNext
        : typeof record.hasMore === 'boolean'
          ? record.hasMore
          : undefined,
  };
}
