import { Check, ChevronRight, MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import { formatFullDeliveryAddress } from '@/lib/location/format';

type Props = {
  coords: { lat: number; lng: number } | null;
  locationLabel: string | null;
  onPress: () => void;
};

/**
 * Compact map-pin CTA for restaurant setup.
 */
export function SetupMapPinCard({ coords, locationLabel, onPress }: Props) {
  const confirmed = Boolean(coords);
  const display =
    (locationLabel && formatFullDeliveryAddress(locationLabel)) ||
    (coords
      ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
      : null);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, confirmed ? styles.cardOk : styles.cardTodo]}
      accessibilityRole="button"
      accessibilityLabel={
        confirmed ? 'Change map pin location' : 'Set outlet location on map'
      }
    >
      <View
        style={[styles.icon, confirmed ? styles.iconOk : styles.iconTodo]}
      >
        {confirmed ? (
          <Check color="#FFFFFF" size={20} strokeWidth={2.5} />
        ) : (
          <MapPin color="#FFFFFF" size={20} />
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>
          {confirmed ? 'Location pinned' : 'Set map pin'}
        </Text>
        <Text style={styles.subtitle} numberOfLines={confirmed ? 2 : 2}>
          {confirmed
            ? display
            : 'Search or use GPS, then place the pin at your entrance'}
        </Text>
        <Text style={[styles.cta, confirmed ? styles.ctaOk : styles.ctaTodo]}>
          {confirmed ? 'Change on map' : 'Open map'}
        </Text>
      </View>

      <ChevronRight
        color={confirmed ? theme.success : theme.primary}
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardOk: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  cardTodo: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOk: {
    backgroundColor: theme.success,
  },
  iconTodo: {
    backgroundColor: theme.primary,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.secondary,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: theme.secondaryLight,
  },
  cta: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  ctaOk: {
    color: theme.success,
  },
  ctaTodo: {
    color: theme.primary,
  },
});
