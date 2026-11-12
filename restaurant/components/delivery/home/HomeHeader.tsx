import { LinearGradient } from 'expo-linear-gradient';
import { Bell, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';

import { BundledImage } from '@/components/media/BundledImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { styles } from '@/components/delivery/home/home-screen-styles';
import { DELIVERY_ROUTES } from '@/lib/delivery-partner/navigation';
import {
  askToEnableLocation,
  refreshLivePlaceNow,
} from '@/lib/delivery-partner/live-place';
import { useLivePlaceSnapshot } from '@/lib/delivery-partner/live-place-store';
import { useRouter } from 'expo-router';

const LIVE_LOCATION_FALLBACK = 'Update to use live location';

export type SavedLiveLocation = {
  label: string;
  lat: number;
  lng: number;
};

type Props = {
  displayName: string;
  unreadCount: number;
  onOpenMap: () => void;
  onLiveLocation: (saved: SavedLiveLocation) => void;
};

export function HomeHeader({
  displayName,
  unreadCount,
  onOpenMap,
  onLiveLocation,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const livePlace = useLivePlaceSnapshot();
  const [updating, setUpdating] = useState(false);

  const locationChip =
    livePlace.label ??
    (livePlace.servicesOn === false
      ? 'Turn on location'
      : livePlace.locating || updating
        ? 'Finding your location…'
        : LIVE_LOCATION_FALLBACK);

  const onUpdate = async () => {
    if (updating) return;
    if (livePlace.servicesOn === false) {
      const ready = await askToEnableLocation();
      if (!ready) return;
    }
    setUpdating(true);
    try {
      const result = await refreshLivePlaceNow();
      if (!result.ok) {
        if (result.reason === 'permission' || result.reason === 'services') {
          await askToEnableLocation();
        } else {
          Alert.alert(
            'Could not update location',
            'Move to an open area and try again.'
          );
        }
        return;
      }
      onLiveLocation({
        label: result.label,
        lat: result.latitude,
        lng: result.longitude,
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <LinearGradient
      colors={['#FFE9D6', '#FFF4EB', '#F6F3F0']}
      locations={[0, 0.62, 1]}
      style={[styles.header, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.logoRow}>
        <BundledImage
          source={require('../../../assets/tokajo-wordmark.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
      <View style={styles.headerRow}>
        <View style={styles.locationBtn}>
          <Text style={styles.greeting} numberOfLines={1}>
            Hi, {displayName.split(' ')[0] || 'Partner'}
          </Text>
          <Pressable
            onPress={() => {
              if (livePlace.servicesOn === false) {
                void askToEnableLocation();
                return;
              }
              onOpenMap();
            }}
            style={styles.dhLocInline}
            accessibilityRole="button"
            accessibilityLabel="Set live location on map"
          >
            <MapPin color="#EA4B14" size={14} strokeWidth={2.4} />
            <Text style={styles.locTitle} numberOfLines={2}>
              {locationChip}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void onUpdate()}
            disabled={updating}
            style={styles.locUpdateHit}
            accessibilityRole="button"
            accessibilityLabel="Update live location"
          >
            {updating ? (
              <ActivityIndicator color="#EA4B14" size="small" />
            ) : (
              <Text style={styles.locUpdate}>Update</Text>
            )}
          </Pressable>
        </View>
        <Pressable
          style={[styles.iconBtn, styles.bellBtn]}
          onPress={() => router.push(DELIVERY_ROUTES.notifications)}
          accessibilityLabel="Notifications"
        >
          <Bell color="#EA4B14" size={20} strokeWidth={2.2} />
          {unreadCount > 0 ? <View style={styles.dhBellDot} /> : null}
        </Pressable>
      </View>
    </LinearGradient>
  );
}
