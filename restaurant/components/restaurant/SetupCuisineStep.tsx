import { UtensilsCrossed } from 'lucide-react-native';
import { Text, View } from 'react-native';

import {
  FormSection,
  SetupChip,
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
  return (
    <View className="gap-4">
      <FormSection
        icon={UtensilsCrossed}
        title="Cuisines"
        subtitle="Optional — helps customers discover your kitchen (max 10)."
      >
        <View className="flex-row flex-wrap gap-2">
          {props.cuisineNames.map((c) => (
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
