import Constants from 'expo-constants';

import type { PermissionDefinition, PermissionId } from '@/lib/permissions/types';

const CORE: PermissionDefinition[] = [
  {
    id: 'notifications',
    title: 'Notifications',
    reason: 'New orders, reminders before accept time runs out, and payout updates.',
  },
  {
    id: 'microphone',
    title: 'Microphone',
    reason: 'In-app calls with customers and riders. Your phone number stays hidden.',
  },
  {
    id: 'location',
    title: 'Location',
    reason: 'Outlet pin on the map, delivery tracking, and rider trips when you go online.',
  },
];

const BACKGROUND: PermissionDefinition = {
  id: 'locationBackground',
  title: 'Background location',
  reason: 'Share live position during an active delivery trip, including when the app is in the background.',
};

export function permissionCatalog(options?: {
  includeRiderBackground?: boolean;
}): PermissionDefinition[] {
  const variant = String(Constants.expoConfig?.extra?.appVariant ?? '').toLowerCase();
  const riderBuild = variant === 'delivery' || options?.includeRiderBackground === true;
  return riderBuild ? [...CORE, BACKGROUND] : CORE;
}

export function permissionIds(options?: { includeRiderBackground?: boolean }): PermissionId[] {
  return permissionCatalog(options).map((row) => row.id);
}
