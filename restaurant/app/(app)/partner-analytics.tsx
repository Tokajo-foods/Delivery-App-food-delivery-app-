import { Redirect } from 'expo-router';

import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';

/** @deprecated Analytics was removed from the rider app. */
export default function LegacyPartnerAnalytics() {
  return <Redirect href={DELIVERY_ROUTES.earnings} />;
}
