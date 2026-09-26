import { ChevronRight, MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  FormSection,
  SetupField,
} from '@/components/restaurant/setup-form-fields';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { theme } from '@/constants/theme';
import {
  INDIA_STATES,
  citiesForState,
} from '@/lib/location/india-geo';

type Props = {
  coords: { lat: number; lng: number } | null;
  locationLabel: string | null;
  onOpenMap: () => void;
  street: string;
  setStreet: (v: string) => void;
  area: string;
  setArea: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateName: string;
  setStateName: (v: string) => void;
  pincode: string;
  setPincode: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
};

export function SetupAddressStep(props: Props) {
  const cityOptions = useMemo(
    () => citiesForState(props.stateName),
    [props.stateName]
  );

  const onStateChange = (next: string) => {
    props.setStateName(next);
    const cities = citiesForState(next);
    if (props.city && !cities.some((c) => c === props.city)) {
      props.setCity('');
    }
  };

  return (
    <View className="gap-4">
      <FormSection
        icon={MapPin}
        title="Address & location"
        subtitle="Pin the outlet on the map, then enter street and pick city / state."
      >
        <Pressable
          onPress={props.onOpenMap}
          className="overflow-hidden rounded-2xl border border-primary/30 bg-[#FFF7ED] p-4"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <MapPin color="#FFFFFF" size={22} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-secondary">
                {props.coords ? 'Location confirmed' : 'Set outlet on map'}
              </Text>
              <Text className="mt-0.5 text-xs leading-4 text-secondary-light">
                {props.coords
                  ? props.locationLabel ??
                    `${props.coords.lat.toFixed(4)}, ${props.coords.lng.toFixed(4)}`
                  : 'Search or use GPS, then drag the pin to your entrance'}
              </Text>
            </View>
            <ChevronRight color={theme.primary} size={20} />
          </View>
        </Pressable>

        <SetupField
          label="Street Address"
          required
          value={props.street}
          onChangeText={props.setStreet}
          placeholder="Shop / building / road (type yourself)"
        />
        <SetupField
          label="Area / Locality"
          value={props.area}
          onChangeText={props.setArea}
          placeholder="e.g. Sector Alpha II, Koramangala"
        />
        <SearchableSelect
          label="State"
          required
          value={props.stateName}
          onChange={onStateChange}
          options={[...INDIA_STATES]}
          placeholder="Select state"
          searchPlaceholder="Search state…"
        />
        <SearchableSelect
          label="City"
          required
          value={props.city}
          onChange={props.setCity}
          options={cityOptions}
          placeholder={
            props.stateName ? 'Select city' : 'Select state first'
          }
          searchPlaceholder="Search city…"
          disabled={!props.stateName}
          emptyText={
            props.stateName
              ? 'No cities match — try another search'
              : 'Select a state first'
          }
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <SetupField
              label="Pincode"
              required
              value={props.pincode}
              onChangeText={props.setPincode}
              keyboardType="number-pad"
              placeholder="560034"
              maxLength={6}
            />
          </View>
          <View className="flex-1">
            <SetupField
              label="Country"
              value={props.country}
              onChangeText={props.setCountry}
              placeholder="India"
            />
          </View>
        </View>
      </FormSection>
    </View>
  );
}
