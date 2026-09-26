import { BadgeIndianRupee, ShieldCheck, Store } from 'lucide-react-native';
import { Text, View } from 'react-native';

import {
  FormSection,
  ImagePickCard,
  SetupChip,
  SetupField,
  SetupTextArea,
} from '@/components/restaurant/setup-form-fields';
import {
  fssaiValidationError,
  gstinValidationError,
  normalizeFssaiInput,
  normalizeGstinInput,
} from '@/lib/restaurant/license-validation';

type PriceRange = 'budget' | 'moderate' | 'expensive' | 'fine_dining';

type Props = {
  logoUri?: string;
  coverUri?: string;
  onPickLogo: () => void;
  onPickCover: () => void;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  fssai: string;
  setFssai: (v: string) => void;
  gstin: string;
  setGstin: (v: string) => void;
  priceRange: PriceRange;
  setPriceRange: (v: PriceRange) => void;
  costForTwo: string;
  setCostForTwo: (v: string) => void;
};

const PRICE_OPTIONS: { id: PriceRange; label: string }[] = [
  { id: 'budget', label: 'Budget' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'expensive', label: 'Expensive' },
  { id: 'fine_dining', label: 'Fine Dining' },
];

export function SetupBasicStep(props: Props) {
  const fssaiErr = fssaiValidationError(props.fssai, { required: true });
  const gstinErr = gstinValidationError(props.gstin);

  return (
    <View className="gap-4">
      <FormSection
        icon={Store}
        title="Outlet identity"
        subtitle="Logo, name and licensing details for your kitchen."
      >
        <View className="flex-row gap-3">
          <ImagePickCard
            title="Restaurant Logo"
            required
            subtitle="Square · PNG/JPG"
            uri={props.logoUri}
            onPick={props.onPickLogo}
          />
          <ImagePickCard
            title="Cover Image"
            subtitle="Optional · 16:9"
            uri={props.coverUri}
            onPick={props.onPickCover}
          />
        </View>

        <SetupField
          label="Restaurant Name"
          required
          value={props.name}
          onChangeText={props.setName}
          placeholder="e.g. Spice Master Kitchen"
        />
        <SetupTextArea
          label="Description"
          value={props.description}
          onChangeText={props.setDescription}
        />
      </FormSection>

      <FormSection
        icon={ShieldCheck}
        title="Legal & licensing"
        subtitle="FSSAI is required. Add GSTIN only if you have one."
      >
        <SetupField
          label="FSSAI License"
          required
          value={props.fssai}
          onChangeText={(v) => props.setFssai(normalizeFssaiInput(v))}
          placeholder="Enter your 14-digit FSSAI number"
          keyboardType="number-pad"
          maxLength={14}
          hint={
            props.fssai
              ? fssaiErr ?? `${props.fssai.length}/14 digits`
              : 'Required — exactly 14 digits'
          }
          hintError={Boolean(fssaiErr)}
        />
        <SetupField
          label="GSTIN"
          value={props.gstin}
          onChangeText={(v) => props.setGstin(normalizeGstinInput(v))}
          placeholder="If you have GSTIN, enter the number"
          autoCapitalize="characters"
          maxLength={15}
          hint={
            props.gstin
              ? gstinErr ?? `${props.gstin.length}/15 characters`
              : 'Optional — leave blank if you do not have GSTIN'
          }
          hintError={Boolean(gstinErr)}
        />
      </FormSection>

      <FormSection
        icon={BadgeIndianRupee}
        title="Pricing"
        subtitle="Helps customers understand your average ticket size."
      >
        <Text className="text-sm font-semibold text-secondary">Price range</Text>
        <View className="flex-row flex-wrap gap-2">
          {PRICE_OPTIONS.map((opt) => (
            <SetupChip
              key={opt.id}
              label={opt.label}
              active={props.priceRange === opt.id}
              onPress={() => props.setPriceRange(opt.id)}
            />
          ))}
        </View>
        <SetupField
          label="Cost for Two (₹)"
          value={props.costForTwo}
          onChangeText={props.setCostForTwo}
          keyboardType="number-pad"
          placeholder="500"
          hint="Approximate amount customers spend for two people"
        />
      </FormSection>
    </View>
  );
}
