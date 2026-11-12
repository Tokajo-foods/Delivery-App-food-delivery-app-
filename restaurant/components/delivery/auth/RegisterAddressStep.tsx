import { ChevronDown, ChevronRight, ChevronUp, MapPin } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { riderAgeYearsFromInput } from '@/components/delivery/auth/register-wizard-form';
import {
  LocationMapPicker,
  type MapPickResult,
} from '@/components/restaurant/LocationMapPicker';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { parseDeliveryAddress } from '@/lib/location';

export type RegisterAddressValues = {
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark: string;
  dateOfBirth: string;
  referralCode: string;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  values: RegisterAddressValues;
  onChange: (patch: Partial<RegisterAddressValues>) => void;
  disabled?: boolean;
};

function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View
      style={{
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: authTheme.cardBorder,
        backgroundColor: authTheme.card,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.semiBold,
          fontSize: 12,
          letterSpacing: 0.35,
          textTransform: 'uppercase',
          color: authTheme.textMuted,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

const DOB_AGE_ROW_H = 48;
const DOB_AGE_AGE_W = 84;

const fieldLabelStyle = {
  fontFamily: fonts.semiBold,
  fontSize: 13,
  color: authTheme.text,
} as const;

/** Single control: DOB entry + derived age on one horizontal line. */
function DobAgeFieldRow({
  dateOfBirth,
  ageYears,
  disabled,
  onChangeDob,
}: {
  dateOfBirth: string;
  ageYears: number | null;
  disabled?: boolean;
  onChangeDob: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const ageLabel = ageYears != null ? `${ageYears}` : '—';
  const ageMuted = ageYears == null;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
          paddingRight: 2,
        }}
      >
        <Text style={[fieldLabelStyle, { flex: 1 }]}>Date of birth</Text>
        <Text style={[fieldLabelStyle, { width: DOB_AGE_AGE_W, textAlign: 'center' }]}>Age</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          height: DOB_AGE_ROW_H,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: focused ? authTheme.inputBorderFocus : '#E2E8F0',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
        }}
      >
        <TextInput
          style={{
            flex: 1,
            paddingHorizontal: 14,
            fontFamily: fonts.medium,
            fontSize: 15,
            color: authTheme.text,
          }}
          placeholder="DD-MM-YYYY"
          placeholderTextColor={authTheme.textDim}
          keyboardType="number-pad"
          value={dateOfBirth}
          editable={!disabled}
          onChangeText={(raw) => onChangeDob(formatDobInput(raw))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <View
          style={{
            width: DOB_AGE_AGE_W,
            borderLeftWidth: 1,
            borderLeftColor: '#E2E8F0',
            backgroundColor: authTheme.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.semiBold,
              fontSize: 16,
              color: ageMuted ? authTheme.textDim : authTheme.text,
            }}
          >
            {ageLabel}
          </Text>
          {ageYears != null ? (
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 12,
                color: authTheme.textMuted,
                marginTop: 2,
              }}
            >
              yrs
            </Text>
          ) : null}
        </View>
      </View>

      <Text
        style={{
          marginTop: 8,
          fontFamily: fonts.regular,
          fontSize: 12,
          color: authTheme.textMuted,
          lineHeight: 17,
        }}
      >
        Use format DD-MM-YYYY
      </Text>
    </View>
  );
}

export function RegisterAddressStep({ values, onChange, disabled }: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(Boolean(values.referralCode.trim()));
  const ageYears = useMemo(() => riderAgeYearsFromInput(values.dateOfBirth), [values.dateOfBirth]);
  const hasPin =
    values.latitude != null &&
    values.longitude != null &&
    Number.isFinite(values.latitude) &&
    Number.isFinite(values.longitude);

  const applyMapPick = (result: MapPickResult) => {
    const parsed = parseDeliveryAddress({
      formattedAddress: result.formattedAddress || result.label,
      label: result.label,
      lat: result.lat,
      lng: result.lng,
      components: result.components,
    });
    const pin =
      parsed.pincode && parsed.pincode !== '000000' && /^\d{6}$/.test(parsed.pincode)
        ? parsed.pincode
        : values.pincode;
    onChange({
      latitude: result.lat,
      longitude: result.lng,
      address:
        parsed.formattedAddress?.trim() ||
        result.formattedAddress?.trim() ||
        result.label?.trim() ||
        values.address,
      city: parsed.city?.trim() || values.city,
      state: parsed.state?.trim() || values.state,
      pincode: pin,
    });
    setMapOpen(false);
  };

  return (
    <View style={{ gap: 14 }}>
      <Pressable
        disabled={disabled}
        onPress={() => setMapOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderWidth: 1,
          borderColor: hasPin ? authTheme.brandMuted : authTheme.cardBorder,
          backgroundColor: hasPin ? authTheme.brandSoft : authTheme.card,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: hasPin ? '#FFFFFF' : authTheme.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: hasPin ? 0 : 1,
            borderColor: authTheme.cardBorder,
          }}
        >
          <MapPin size={20} color={hasPin ? authTheme.brand : authTheme.textMuted} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 15, color: authTheme.text }}>
            {hasPin ? 'Home location pinned' : 'Pin home on map'}
          </Text>
          <Text
            numberOfLines={2}
            style={{ fontFamily: fonts.regular, fontSize: 13, color: authTheme.textMuted, lineHeight: 18 }}
          >
            {hasPin
              ? values.address?.trim() || 'Tap to adjust your pin'
              : 'Required — offers are matched around this location'}
          </Text>
        </View>
        <ChevronRight size={18} color={authTheme.textDim} />
      </Pressable>

      <SectionCard title="Address">
        <AuthField
          label="Street address"
          placeholder="House / street"
          value={values.address}
          editable={!disabled}
          onChangeText={(address) => onChange({ address })}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AuthField
              noMargin
              label="City"
              placeholder="City"
              autoCapitalize="words"
              value={values.city}
              editable={!disabled}
              onChangeText={(city) => onChange({ city })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AuthField
              noMargin
              label="State"
              placeholder="State"
              autoCapitalize="words"
              value={values.state}
              editable={!disabled}
              onChangeText={(state) => onChange({ state })}
            />
          </View>
        </View>
        <AuthField
          label="PIN code"
          placeholder="6-digit PIN"
          keyboardType="number-pad"
          value={values.pincode}
          editable={!disabled}
          onChangeText={(pincode) => onChange({ pincode: pincode.replace(/\D/g, '').slice(0, 6) })}
        />
        <AuthField
          label="Landmark"
          placeholder="Optional — near metro, gate, etc."
          value={values.landmark}
          editable={!disabled}
          onChangeText={(landmark) => onChange({ landmark })}
        />
      </SectionCard>

      <SectionCard title="Identity">
        <DobAgeFieldRow
          dateOfBirth={values.dateOfBirth}
          ageYears={ageYears}
          disabled={disabled}
          onChangeDob={(dateOfBirth) => onChange({ dateOfBirth })}
        />
      </SectionCard>

      <View
        style={{
          borderRadius: 12,
          borderWidth: 1,
          borderColor: authTheme.cardBorder,
          backgroundColor: authTheme.surface,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => setOptionalOpen((v) => !v)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text style={{ fontFamily: fonts.semiBold, fontSize: 13, color: authTheme.text }}>
            Referral code
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted }}>
              Optional
            </Text>
            {optionalOpen ? (
              <ChevronUp size={18} color={authTheme.textMuted} />
            ) : (
              <ChevronDown size={18} color={authTheme.textMuted} />
            )}
          </View>
        </Pressable>
        {optionalOpen ? (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
            <AuthField
              noMargin
              label="Code"
              placeholder="From another partner"
              autoCapitalize="characters"
              value={values.referralCode}
              editable={!disabled}
              onChangeText={(referralCode) =>
                onChange({ referralCode: referralCode.replace(/\s/g, '') })
              }
            />
          </View>
        ) : null}
      </View>

      <LocationMapPicker
        visible={mapOpen}
        initial={hasPin ? { lat: values.latitude!, lng: values.longitude! } : null}
        autoDetectOnOpen={!hasPin}
        locationTitle="WHERE YOU LIVE"
        currentLocationHint="Pin your home. Order offers are matched around this location."
        onClose={() => setMapOpen(false)}
        onConfirm={applyMapPick}
      />
    </View>
  );
}
