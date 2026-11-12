import { UtensilsCrossed } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import {
  FormSection,
  SetupChip,
  SetupField,
  SummaryRow,
} from '@/components/restaurant/setup-form-fields';

type Props = {
  cuisineNames: string[];
  cuisineError: boolean;
  cuisines: string[];
  setCuisines: (updater: (prev: string[]) => string[]) => void;
  name: string;
  city: string;
  stateName: string;
  logoLabel: string;
  locationReady: boolean;
  fssai: string;
  gstin: string;
};

export function SetupCuisineStep(props: Props) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return props.cuisineNames;
    return props.cuisineNames.filter((c) => c.toLowerCase().includes(q));
  }, [props.cuisineNames, search]);

  return (
    <View className="gap-4">
      <FormSection
        icon={UtensilsCrossed}
        title="Cuisines"
        subtitle="Optional — pick up to 10. Search to find your style faster."
      >
        <SetupField
          label="Search cuisines"
          value={search}
          onChangeText={setSearch}
          placeholder="e.g. South Indian, Biryani, Cafe…"
        />
        <Text className="-mt-1 mb-1 text-[11px] text-secondary-light">
          {props.cuisineNames.length} options · showing {filtered.length}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {filtered.map((c) => (
            <SetupChip
              key={c}
              label={c}
              active={props.cuisines.includes(c)}
              onPress={() =>
                props.setCuisines((prev) => {
                  if (prev.includes(c)) return prev.filter((x) => x !== c);
                  if (prev.length >= 10) return prev;
                  return [...prev, c];
                })
              }
            />
          ))}
        </View>
        {filtered.length === 0 ? (
          <Text className="text-sm text-secondary-light">No match — try another keyword.</Text>
        ) : null}
        {props.cuisineError ? (
          <Text className="text-sm text-red-500">
            Could not load cuisine catalog. A local list is shown — you can still continue.
          </Text>
        ) : null}
        <Text className="text-xs font-medium text-secondary-light">
          Selected: {props.cuisines.length ? props.cuisines.join(', ') : 'None yet'}
        </Text>
      </FormSection>

      <FormSection
        icon={UtensilsCrossed}
        title="Review & register"
        subtitle="Confirm these details before submitting your outlet."
      >
        <SummaryRow label="Name" value={props.name || '—'} />
        <SummaryRow
          label="City"
          value={props.city ? `${props.city}, ${props.stateName}` : '—'}
        />
        <SummaryRow label="FSSAI" value={props.fssai || '—'} />
        <SummaryRow label="GSTIN" value={props.gstin || 'Not provided'} />
        <SummaryRow
          label="Cuisines"
          value={props.cuisines.length ? props.cuisines.join(', ') : '—'}
        />
        <SummaryRow label="Logo" value={props.logoLabel} />
        <SummaryRow
          label="Map pin"
          value={props.locationReady ? 'Confirmed' : 'Missing'}
        />
      </FormSection>
    </View>
  );
}
