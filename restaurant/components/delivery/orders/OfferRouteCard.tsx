import { Text, View } from 'react-native';

import { incomingOfferStyles as styles } from '@/components/delivery/orders/incoming-offer-styles';
import {
  formatEtaMinutes,
  formatTripKm,
} from '@/lib/delivery-partner/offer-geo';

type Props = {
  restaurantName: string;
  pickupAddress?: string;
  pickupKm?: number | null;
  pickupEtaMin?: number | null;
  dropAddress?: string;
  dropKm?: number | null;
  dropEtaMin?: number | null;
  totalEtaMin?: number | null;
  showYouLeg?: boolean;
  youKm?: number | null;
  locating?: boolean;
  roadLoading?: boolean;
  isRoadKm?: boolean;
};

function distanceLine(
  km: number | null | undefined,
  etaMin: number | null | undefined,
  suffix: string
) {
  const kmLabel = formatTripKm(km);
  const eta = formatEtaMinutes(etaMin);
  if (!kmLabel && !eta) return null;
  const main = [kmLabel, eta].filter(Boolean).join(' · ');
  return suffix ? `${main} ${suffix}` : main;
}

export function OfferRouteCard({
  restaurantName,
  pickupAddress,
  pickupKm,
  pickupEtaMin,
  dropAddress,
  dropKm,
  dropEtaMin,
  locating,
  roadLoading,
  youKm,
}: Props) {
  const pickupLine = distanceLine(youKm ?? pickupKm, pickupEtaMin, 'to restaurant');
  const dropLine = distanceLine(dropKm, dropEtaMin, 'to customer');
  const measuring = Boolean(roadLoading || locating);

  return (
    <View style={styles.routeBlock}>
      <View style={styles.stop}>
        <Text style={styles.stopLabel}>Pickup</Text>
        <Text style={styles.stopTitle} numberOfLines={2}>
          {restaurantName}
        </Text>
        {pickupAddress ? (
          <Text style={styles.stopMetaMuted} numberOfLines={1}>
            {pickupAddress}
          </Text>
        ) : null}
        {pickupLine ? (
          <Text style={styles.stopMeta}>{pickupLine}</Text>
        ) : measuring ? (
          <Text style={styles.stopMetaMuted}>Checking distance…</Text>
        ) : null}
      </View>
      <View style={styles.stopDivider} />
      <View style={styles.stop}>
        <Text style={styles.stopLabel}>Customer</Text>
        <Text style={styles.stopTitle} numberOfLines={2}>
          {dropAddress || 'Drop address'}
        </Text>
        {dropLine ? (
          <Text style={styles.stopMeta}>{dropLine}</Text>
        ) : measuring ? (
          <Text style={styles.stopMetaMuted}>Checking distance…</Text>
        ) : null}
      </View>
    </View>
  );
}
