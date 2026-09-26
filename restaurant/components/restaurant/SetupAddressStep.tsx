import { MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SetupMapPinCard } from '@/components/restaurant/SetupMapPinCard';
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
    if (!props.country.trim()) props.setCountry('India');
  };

  return (
    <View style={styles.root}>
      <FormSection
        icon={MapPin}
        title="Delivery location"
        subtitle="Pin on the map, then fill the address fields below."
      >
        <SetupMapPinCard
          coords={props.coords}
          locationLabel={props.locationLabel}
          onPress={props.onOpenMap}
        />

        <View style={styles.divider} />

        <SetupField
          label="Street address"
          required
          value={props.street}
          onChangeText={props.setStreet}
          placeholder="Shop / building / road"
        />
        <SetupField
          label="Area / locality"
          value={props.area}
          onChangeText={props.setArea}
          placeholder="Locality or sector"
        />

        <SearchableSelect
          label="State"
          required
          value={props.stateName}
          onChange={onStateChange}
          options={[...INDIA_STATES]}
          placeholder="Select state"
          searchPlaceholder="Search state"
        />
        <SearchableSelect
          label="City"
          required
          value={props.city}
          onChange={props.setCity}
          options={cityOptions}
          placeholder={props.stateName ? 'Select city' : 'Select state first'}
          searchPlaceholder="Search city"
          disabled={!props.stateName}
          emptyText={
            props.stateName
              ? 'No cities match your search'
              : 'Select a state first'
          }
        />

        <SetupField
          label="Pincode"
          required
          value={props.pincode}
          onChangeText={props.setPincode}
          keyboardType="number-pad"
          placeholder="6-digit PIN"
          maxLength={6}
        />

        <Text style={styles.countryNote}>
          Country · {props.country.trim() || 'India'}
        </Text>
      </FormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  countryNote: {
    marginTop: -4,
    fontSize: 12,
    fontWeight: '600',
    color: theme.secondaryLight,
  },
});
