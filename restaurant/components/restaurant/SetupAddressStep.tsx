import { Building2, MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { SetupMapPinCard } from '@/components/restaurant/SetupMapPinCard';
import {
  FormSection,
  SetupField,
} from '@/components/restaurant/setup-form-fields';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
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

function FieldGroupTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <View className="mb-1 mt-1">
      <Text className="text-[11px] font-bold uppercase tracking-wider text-secondary-light">
        {title}
      </Text>
      {hint ? (
        <Text className="mt-0.5 text-[11px] leading-4 text-gray-400">{hint}</Text>
      ) : null}
    </View>
  );
}

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
    <View className="gap-4">
      <FormSection
        icon={MapPin}
        title="Map location"
        subtitle="Customers and riders use this pin for delivery."
      >
        <SetupMapPinCard
          coords={props.coords}
          locationLabel={props.locationLabel}
          onPress={props.onOpenMap}
        />
      </FormSection>

      <FormSection
        icon={Building2}
        title="Outlet address"
        subtitle="Enter the address as it should appear on orders."
      >
        <FieldGroupTitle
          title="Street details"
          hint="Shop number, building and road — type these yourself"
        />
        <SetupField
          label="Street address"
          required
          value={props.street}
          onChangeText={props.setStreet}
          placeholder="e.g. Shop 12, Block K, Main Road"
        />
        <SetupField
          label="Area / locality"
          value={props.area}
          onChangeText={props.setArea}
          placeholder="e.g. Delta II, Koramangala 5th Block"
        />

        <FieldGroupTitle
          title="City & region"
          hint="Search and select from the official India list"
        />
        <SearchableSelect
          label="State"
          required
          value={props.stateName}
          onChange={onStateChange}
          options={[...INDIA_STATES]}
          placeholder="Search & select state"
          searchPlaceholder="Type to search states…"
        />
        <SearchableSelect
          label="City"
          required
          value={props.city}
          onChange={props.setCity}
          options={cityOptions}
          placeholder={
            props.stateName ? 'Search & select city' : 'Select state first'
          }
          searchPlaceholder="Type to search cities…"
          disabled={!props.stateName}
          emptyText={
            props.stateName
              ? 'No cities match your search'
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
              placeholder="6-digit PIN"
              maxLength={6}
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1.5 text-sm font-semibold text-secondary">
              Country
            </Text>
            <View className="h-[52px] flex-row items-center rounded-2xl border border-gray-200 bg-[#F1F5F9] px-4">
              <View className="mr-2 h-2 w-2 rounded-full bg-success" />
              <Text className="text-[15px] font-semibold text-secondary">
                {props.country.trim() || 'India'}
              </Text>
            </View>
          </View>
        </View>
      </FormSection>
    </View>
  );
}
