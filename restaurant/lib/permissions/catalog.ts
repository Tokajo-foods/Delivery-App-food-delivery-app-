import Constants from 'expo-constants';

import type { PermissionDefinition, PermissionId } from '@/lib/permissions/types';

const KITCHEN: PermissionDefinition[] = [
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

/** Rider home: explain first, then the OS permission dialogs (Play / App Store). */
const RIDER: PermissionDefinition[] = [
  {
    id: 'location',
    title: 'Location',
    reason:
      'Verify arrival at the restaurant and customer, show your live position on the map, and receive nearby order offers.',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    reason:
      'Instant alerts for new delivery offers, trip updates, payouts, and important account messages—even when the app is in the background.',
  },
  {
    id: 'microphone',
    title: 'Microphone',
    reason:
      'Talk on in-app calls with customers and support during a trip. Your personal mobile number stays private.',
  },
  {
    id: 'locationBackground',
    title: 'Location all the time',
    reason:
      'Share live trip location while you are online or on a delivery, including when the app is closed or not in use. Required before you can go online.',
  },
];

export function permissionCatalog(options?: {
  includeRiderBackground?: boolean;
}): PermissionDefinition[] {
  const variant = String(Constants.expoConfig?.extra?.appVariant ?? '').toLowerCase();
  const riderBuild = variant === 'delivery' || options?.includeRiderBackground === true;
  return riderBuild ? RIDER : KITCHEN;
}

export function permissionIds(options?: { includeRiderBackground?: boolean }): PermissionId[] {
  return permissionCatalog(options).map((row) => row.id);
}
