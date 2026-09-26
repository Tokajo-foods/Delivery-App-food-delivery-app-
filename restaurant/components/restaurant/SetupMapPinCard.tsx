import { Check, ChevronRight, MapPinned } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { cardShadow, theme } from '@/constants/theme';
import { formatFullDeliveryAddress } from '@/lib/location/format';

type Props = {
  coords: { lat: number; lng: number } | null;
  locationLabel: string | null;
  onPress: () => void;
};

/**
 * Map pin CTA for restaurant setup — confirmed vs empty states.
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
      className={`overflow-hidden rounded-2xl border p-4 ${
        confirmed
          ? 'border-success/30 bg-[#F0FDF4]'
          : 'border-primary/25 bg-[#FFF7ED]'
      }`}
      style={cardShadow}
      accessibilityRole="button"
      accessibilityLabel={
        confirmed ? 'Change map pin location' : 'Set outlet location on map'
      }
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`mt-0.5 h-12 w-12 items-center justify-center rounded-2xl ${
            confirmed ? 'bg-success' : 'bg-primary'
          }`}
        >
          {confirmed ? (
            <Check color="#FFFFFF" size={22} strokeWidth={2.5} />
          ) : (
            <MapPinned color="#FFFFFF" size={22} />
          )}
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-extrabold text-secondary">
              {confirmed ? 'Pin confirmed' : 'Pin on map'}
            </Text>
            {confirmed ? (
              <View className="rounded-full bg-success/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-success">
                  Ready
                </Text>
              </View>
            ) : (
              <View className="rounded-full bg-primary/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold uppercase tracking-wide text-primary">
                  Required
                </Text>
              </View>
            )}
          </View>
          <Text
            className="mt-1 text-[13px] leading-5 text-secondary-light"
            numberOfLines={confirmed ? 3 : 2}
          >
            {confirmed
              ? display
              : 'Open Google Maps, search or use GPS, then place the pin at your entrance.'}
          </Text>
          <Text
            className={`mt-2 text-xs font-bold ${
              confirmed ? 'text-success' : 'text-primary'
            }`}
          >
            {confirmed ? 'Tap to adjust pin' : 'Tap to open map'}
          </Text>
        </View>

        <ChevronRight
          color={confirmed ? theme.success : theme.primary}
          size={20}
          style={{ marginTop: 4 }}
        />
      </View>
    </Pressable>
  );
}
