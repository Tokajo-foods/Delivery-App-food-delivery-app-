import { ChevronRight, Navigation } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { GOOGLE_MAP_PROVIDER } from '@/lib/maps/google-map-provider';
import {
  formatDeliveryAddress,
  normalizeDeliveryStatus,
} from '@/lib/delivery-partner/api';
import { decodeGooglePolyline } from '@/lib/delivery-partner/decode-polyline';
import { partnerLocationTracker } from '@/lib/delivery-partner/location-tracker';
import { useOrderTrackingSocket } from '@/lib/delivery-partner/tracking-socket';
import {
  etaLabel,
  formatDistanceMeters,
  formatEtaSeconds,
  type OrderTracking,
  type PartnerLiveLocation,
  type TrackingEta,
} from '@/lib/delivery-partner/tracking-types';
import type { PartnerDelivery, TripNavRoute } from '@/lib/delivery-partner/types';
import { useAuthStore } from '@/store/auth-store';
import { PlaceMapPin, RiderMapPin } from '@/components/delivery/orders/trip-map-pins';

type LatLng = { latitude: number; longitude: number };

function isValidPoint(lat?: number | null, lng?: number | null): lat is number {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    !(lat === 0 && lng === 0)
  );
}

function openExternalNav(point: LatLng, label?: string) {
  const destination = `${point.latitude},${point.longitude}`;
  void Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
  );
}

type Props = {
  delivery: PartnerDelivery;
  tracking?: OrderTracking | null;
  eta?: TrackingEta | null;
  liveLocation?: PartnerLiveLocation | null;
  routePolyline?: string | null;
  routePoints?: LatLng[];
  historyPolyline?: string | null;
  historyPoints?: LatLng[];
  navRoute?: TripNavRoute | null;
  onTrackingPatch?: (patch: Partial<OrderTracking>) => void;
  /** Full-bleed map for the live trip session (Swiggy-style). */
  fill?: boolean;
};

/**
 * Trip map: Google Map + server polyline/ETA (no Directions from the phone).
 */
export function DeliveryTripMap({
  delivery,
  tracking,
  eta,
  liveLocation,
  routePolyline,
  routePoints,
  historyPolyline,
  historyPoints,
  navRoute,
  onTrackingPatch,
  fill = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView | null>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const [rider, setRider] = useState<LatLng | null>(() => {
    const known = partnerLocationTracker.getLastKnown();
    return known
      ? { latitude: known.latitude, longitude: known.longitude }
      : null;
  });
  const [socketEta, setSocketEta] = useState<{
    etaSeconds?: number | null;
    distanceMeters?: number | null;
    polyline?: string;
    provider?: string;
    durationInTraffic?: boolean;
  } | null>(null);

  const status = normalizeDeliveryStatus(tracking?.status || delivery.status);
  const pickupLabel =
    tracking?.pickup?.address ||
    formatDeliveryAddress(delivery.restaurantAddress) ||
    delivery.restaurantName ||
    'restaurant';
  const dropLabel =
    tracking?.drop?.address ||
    formatDeliveryAddress(delivery.deliveryAddress) ||
    delivery.customerName ||
    'customer';

  const pickup = useMemo<LatLng | null>(() => {
    if (isValidPoint(tracking?.pickup?.latitude, tracking?.pickup?.longitude)) {
      return {
        latitude: tracking!.pickup!.latitude,
        longitude: tracking!.pickup!.longitude,
      };
    }
    const rest = delivery.restaurantAddress;
    if (isValidPoint(rest?.lat, rest?.lng)) {
      return { latitude: rest!.lat!, longitude: rest!.lng! };
    }
    return null;
  }, [
    tracking?.pickup?.latitude,
    tracking?.pickup?.longitude,
    delivery.restaurantAddress?.lat,
    delivery.restaurantAddress?.lng,
  ]);

  const drop = useMemo<LatLng | null>(() => {
    if (isValidPoint(tracking?.drop?.latitude, tracking?.drop?.longitude)) {
      return {
        latitude: tracking!.drop!.latitude,
        longitude: tracking!.drop!.longitude,
      };
    }
    const live = delivery.customerLiveLocation;
    if (isValidPoint(live?.lat, live?.lng)) {
      return { latitude: live.lat, longitude: live.lng };
    }
    if (
      isValidPoint(delivery.deliveryAddress?.lat, delivery.deliveryAddress?.lng)
    ) {
      return {
        latitude: delivery.deliveryAddress!.lat!,
        longitude: delivery.deliveryAddress!.lng!,
      };
    }
    return null;
  }, [
    tracking?.drop?.latitude,
    tracking?.drop?.longitude,
    delivery.customerLiveLocation?.lat,
    delivery.customerLiveLocation?.lng,
    delivery.deliveryAddress?.lat,
    delivery.deliveryAddress?.lng,
  ]);

  const encoded =
    navRoute?.polyline ||
    socketEta?.polyline ||
    tracking?.polyline ||
    routePolyline ||
    historyPolyline ||
    '';
  const decoded = useMemo(() => decodeGooglePolyline(encoded), [encoded]);
  const polylineCoords =
    decoded.length >= 2
      ? decoded
      : navRoute?.points && navRoute.points.length >= 2
        ? navRoute.points
        : routePoints && routePoints.length >= 2
          ? routePoints
          : historyPoints && historyPoints.length >= 2
            ? historyPoints
            : [];

  const riderFromApi = liveLocation ?? tracking?.riderLocation;
  const displayRider = useMemo<LatLng | null>(() => {
    if (rider) return rider;
    if (isValidPoint(riderFromApi?.latitude, riderFromApi?.longitude)) {
      return {
        latitude: riderFromApi!.latitude,
        longitude: riderFromApi!.longitude,
      };
    }
    return null;
  }, [rider, riderFromApi?.latitude, riderFromApi?.longitude]);

  const navTarget = useMemo(() => {
    if (navRoute?.destination) {
      const kind = navRoute.leg === 'return' || navRoute.leg === 'pickup'
        ? pickupLabel
        : dropLabel;
      return {
        point: {
          latitude: navRoute.destination.latitude,
          longitude: navRoute.destination.longitude,
        },
        label: kind,
      };
    }
    if (
      status === 'accepted' ||
      status === 'arrived' ||
      status === 'returning_to_restaurant'
    ) {
      return pickup ? { point: pickup, label: pickupLabel } : null;
    }
    if (status === 'picked_up' || status === 'out_for_delivery') {
      return drop ? { point: drop, label: dropLabel } : null;
    }
    return drop
      ? { point: drop, label: dropLabel }
      : pickup
        ? { point: pickup, label: pickupLabel }
        : null;
  }, [status, pickup, drop, pickupLabel, dropLabel, navRoute]);

  const headingToDrop =
    status === 'picked_up' ||
    status === 'out_for_delivery' ||
    status === 'at_customer';
  const returning =
    navRoute?.leg === 'return' || status === 'returning_to_restaurant';
  const navPlace = returning
    ? delivery.restaurantName || 'Restaurant'
    : headingToDrop
      ? delivery.customerName || 'Customer'
      : delivery.restaurantName || 'Restaurant';

  const etaSeconds =
    navRoute?.etaSeconds ??
    socketEta?.etaSeconds ??
    eta?.etaSeconds ??
    tracking?.etaSeconds;
  const distanceMeters =
    navRoute?.distanceMeters ??
    socketEta?.distanceMeters ??
    eta?.distanceMeters ??
    tracking?.distanceMeters;
  const provider =
    navRoute?.provider ??
    socketEta?.provider ??
    eta?.provider ??
    tracking?.provider;
  const durationInTraffic =
    navRoute?.durationInTraffic ??
    socketEta?.durationInTraffic ??
    eta?.durationInTraffic ??
    tracking?.durationInTraffic;
  const nextInstruction = navRoute?.nextInstruction;
  const hint = tracking?.dutyHint;
  const goingToCustomer =
    status === 'picked_up' ||
    status === 'out_for_delivery' ||
    status === 'at_customer' ||
    status === 'arrived_at_customer';
  const destinationKind =
    navRoute?.leg === 'return' ||
    navRoute?.leg === 'pickup' ||
    status === 'returning_to_restaurant' ||
    !goingToCustomer
      ? 'restaurant'
      : 'customer';
  const destination = destinationKind === 'restaurant' ? pickup : drop;
  const [tracksPins, setTracksPins] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setTracksPins(false), 700);
    return () => clearTimeout(timer);
  }, [
    destination?.latitude,
    destination?.longitude,
    displayRider?.latitude,
    displayRider?.longitude,
  ]);
  const historyCoords =
    historyPoints && historyPoints.length >= 2 ? historyPoints : [];

  useOrderTrackingSocket(
    delivery.orderId,
    userId,
    Boolean(delivery.orderId),
    {
      onLocation: (point) => {
        setRider({ latitude: point.latitude, longitude: point.longitude });
        onTrackingPatch?.({
          riderLocation: {
            latitude: point.latitude,
            longitude: point.longitude,
            speed: point.speed,
            heading: point.heading,
          },
        });
      },
      onEta: (eta) => {
        setSocketEta(eta);
        onTrackingPatch?.({
          etaSeconds: eta.etaSeconds,
          distanceMeters: eta.distanceMeters,
          polyline: eta.polyline,
          provider: eta.provider,
          durationInTraffic: eta.durationInTraffic,
        });
      },
      onStatus: (payload) => {
        if (payload.status) onTrackingPatch?.({ status: payload.status });
      },
    }
  );

  useEffect(() => {
    const unsub = partnerLocationTracker.subscribe((coords) => {
      if (!coords) return;
      setRider({ latitude: coords.latitude, longitude: coords.longitude });
    });
    return unsub;
  }, [delivery.id]);

  useEffect(() => {
    if (!mapRef.current) return;
    const points = [
      ...polylineCoords,
      displayRider,
      pickup,
      drop,
    ].filter(Boolean) as LatLng[];
    if (!points.length) return;
    if (points.length === 1) {
      mapRef.current.animateToRegion(
        { ...points[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
        350
      );
      return;
    }
    mapRef.current.fitToCoordinates(points, {
      edgePadding: fill
        ? { top: 88, right: 40, bottom: 88, left: 40 }
        : { top: 56, right: 40, bottom: 56, left: 40 },
      animated: true,
    });
  }, [
    polylineCoords.length,
    displayRider?.latitude,
    displayRider?.longitude,
    pickup,
    drop,
    fill,
  ]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, fill && styles.fillWrap]}>
        <Text style={styles.fallbackText}>
          Live trip map is available on the mobile app.
        </Text>
        {navTarget ? (
          <Pressable
            onPress={() => openExternalNav(navTarget.point, navTarget.label)}
            style={styles.navBtn}
          >
            <View style={styles.navIcon}>
              <Navigation color="#EA4B14" size={16} />
            </View>
            <View style={styles.navCopy}>
              <Text style={styles.navKicker}>Navigate</Text>
              <Text style={styles.navBtnText} numberOfLines={1}>
                {navPlace}
              </Text>
            </View>
            <View style={styles.navGo}>
              <ChevronRight color="#FFFFFF" size={16} />
            </View>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (!pickup && !drop && !displayRider && polylineCoords.length < 2) {
    return (
      <View style={[styles.fallback, fill && styles.fillWrap]}>
        <Text style={styles.fallbackText}>
          Waiting for trip pins and GPS…
        </Text>
      </View>
    );
  }

  const initial = displayRider ?? pickup ?? drop ?? polylineCoords[0];

  return (
    <View style={[styles.wrap, fill && styles.fillWrap]}>
      <MapView
        ref={mapRef}
        style={fill ? styles.fillMap : styles.map}
        provider={GOOGLE_MAP_PROVIDER}
        initialRegion={
          initial
            ? { ...initial, latitudeDelta: 0.04, longitudeDelta: 0.04 }
            : undefined
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        loadingEnabled
      >
        {destination ? (
          <Marker
            coordinate={destination}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={tracksPins}
            title={destinationKind === 'restaurant' ? 'Restaurant' : 'Customer'}
            description={
              destinationKind === 'restaurant' ? pickupLabel : dropLabel
            }
          >
            <PlaceMapPin kind={destinationKind} />
          </Marker>
        ) : null}
        {displayRider ? (
          <Marker
            coordinate={displayRider}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            tracksViewChanges
            title="You"
            description="Your location"
          >
            <RiderMapPin />
          </Marker>
        ) : null}
        {historyCoords.length >= 2 ? (
          <Polyline
            coordinates={historyCoords}
            strokeColor="#94A3B8"
            strokeWidth={3}
            lineDashPattern={[8, 6]}
          />
        ) : null}
        {polylineCoords.length >= 2 ? (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={authTheme.brand}
            strokeWidth={4}
          />
        ) : null}
      </MapView>

      <View
        style={[
          styles.etaChip,
          fill && styles.etaChipFill,
          fill && { top: Math.max(insets.top, 12) + 8 },
        ]}
      >
        {nextInstruction ? (
          <Text style={styles.turnText} numberOfLines={2}>
            {nextInstruction}
          </Text>
        ) : null}
        <Text style={styles.etaHint} numberOfLines={1}>
          {hint && !/head to destination/i.test(hint)
            ? hint
            : navRoute?.leg === 'return'
              ? `Return to ${pickupLabel}`
              : navRoute?.leg === 'drop' ||
                  status === 'picked_up' ||
                  status === 'out_for_delivery' ||
                  status === 'at_customer'
                ? `Heading to ${dropLabel}`
                : `Heading to ${pickupLabel}`}
        </Text>
        <Text style={styles.etaValue}>
          {formatEtaSeconds(etaSeconds)}
          {distanceMeters != null
            ? ` · ${formatDistanceMeters(distanceMeters)}`
            : ''}
        </Text>
        <Text style={styles.etaProvider}>
          {etaLabel({ provider, durationInTraffic })}
        </Text>
      </View>

      {navTarget ? (
        <Pressable
          onPress={() => openExternalNav(navTarget.point, navTarget.label)}
          style={[styles.navBtn, fill && styles.navBtnFill]}
        >
          <View style={styles.navIcon}>
            <Navigation color="#EA4B14" size={16} />
          </View>
          <View style={styles.navCopy}>
            <Text style={styles.navKicker}>
              {returning ? 'Return' : 'Navigate'}
            </Text>
            <Text style={styles.navBtnText} numberOfLines={1}>
              {navPlace}
            </Text>
          </View>
          <View style={styles.navGo}>
            <ChevronRight color="#FFFFFF" size={16} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#F8F1EC',
  },
  fillWrap: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
  },
  map: {
    width: '100%',
    height: 248,
  },
  fillMap: {
    ...StyleSheet.absoluteFillObject,
  },
  etaChip: {
    marginHorizontal: 10,
    marginTop: -36,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  etaChipFill: {
    position: 'absolute',
    left: 12,
    right: 12,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  navBtnFill: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    margin: 0,
  },
  etaHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#9CA3AF',
  },
  turnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 4,
  },
  etaValue: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: '#0F172A',
  },
  etaProvider: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: '#EA4B14',
  },
  navBtn: {
    marginHorizontal: 12,
    marginTop: 2,
    marginBottom: 12,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1EAE3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navCopy: {
    flex: 1,
    minWidth: 0,
  },
  navKicker: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#EA4B14',
  },
  navBtnText: {
    marginTop: 1,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#1E293B',
  },
  navGo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    backgroundColor: authTheme.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  fallbackText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.textMuted,
    textAlign: 'center',
  },
});
