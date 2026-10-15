import {
  CalendarClock,
  FileText,
  Gift,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react-native';

import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

export type HomeFeature = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

/** Home Services quick actions — Documents, Shifts, Incentives, Support. */
export const MORE_FEATURES: HomeFeature[] = [
  {
    key: 'documents',
    label: 'Documents',
    description: 'KYC upload & verification',
    href: DELIVERY_ROUTES.documents,
    icon: FileText,
  },
  {
    key: 'shifts',
    label: 'Shifts',
    description: 'Book slots & attendance',
    href: DELIVERY_ROUTES.shifts,
    icon: CalendarClock,
  },
  {
    key: 'incentives',
    label: 'Incentives',
    description: 'Bonuses, points & leaderboard',
    href: DELIVERY_ROUTES.incentives,
    icon: Gift,
  },
  {
    key: 'support',
    label: 'Support',
    description: 'Help & tickets',
    href: DELIVERY_ROUTES.support,
    icon: HelpCircle,
  },
];
