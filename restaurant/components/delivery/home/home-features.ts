import {
  Award,
  Building2,
  CalendarClock,
  FileText,
  Flame,
  Gift,
  HelpCircle,
  UtensilsCrossed,
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

/** Quick-access services shown as a horizontal rail on the partner home. */
export const MORE_FEATURES: HomeFeature[] = [
  {
    key: 'documents',
    label: 'Documents',
    description: 'KYC upload & verification',
    href: DELIVERY_ROUTES.documents,
    icon: FileText,
  },
  {
    key: 'restaurants',
    label: 'Restaurants',
    description: 'Partner outlets near you',
    href: DELIVERY_ROUTES.restaurants,
    icon: UtensilsCrossed,
  },
  {
    key: 'shifts',
    label: 'Shifts',
    description: 'Book slots & attendance',
    href: DELIVERY_ROUTES.shifts,
    icon: CalendarClock,
  },
  {
    key: 'hubs',
    label: 'Hubs',
    description: 'Check-in & cash drop',
    href: DELIVERY_ROUTES.hubs,
    icon: Building2,
  },
  {
    key: 'heatmap',
    label: 'Demand',
    description: 'Nearby order heatmap',
    href: DELIVERY_ROUTES.heatmap,
    icon: Flame,
  },
  {
    key: 'incentives',
    label: 'Incentives',
    description: 'Bonuses, points & leaderboard',
    href: DELIVERY_ROUTES.incentives,
    icon: Gift,
  },
  {
    key: 'performance',
    label: 'Performance',
    description: 'Ratings, tier, warnings & referrals',
    href: DELIVERY_ROUTES.performance,
    icon: Award,
  },
  {
    key: 'support',
    label: 'Support',
    description: 'Help & tickets',
    href: DELIVERY_ROUTES.support,
    icon: HelpCircle,
  },
];
