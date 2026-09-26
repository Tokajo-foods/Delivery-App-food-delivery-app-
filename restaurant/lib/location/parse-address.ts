import { extractCityFromAddress, normalizeCityName } from '@/lib/location/format';

export type ParsedDeliveryAddress = {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  formattedAddress: string;
  label?: string;
  lat?: number;
  lng?: number;
};

/** Google Geocoding / Places address_component entry. */
export type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types: string[];
};

const STATE_NAMES = [
  'Madhya Pradesh',
  'Uttar Pradesh',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Himachal Pradesh',
  'Tamil Nadu',
  'West Bengal',
  'Maharashtra',
  'Karnataka',
  'Gujarat',
  'Rajasthan',
  'Punjab',
  'Haryana',
  'Bihar',
  'Odisha',
  'Kerala',
  'Telangana',
  'Assam',
  'Delhi',
  'Jharkhand',
  'Chhattisgarh',
  'Goa',
  'Uttarakhand',
  'Jammu and Kashmir',
];

/** Open Location Code / Plus Code, e.g. FH2M+7VW or FGJ9+84C. */
const PLUS_CODE_RE = /\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}\b/gi;

export function isPlusCodeToken(value?: string | null): boolean {
  if (!value?.trim()) return false;
  return /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}$/i.test(value.trim());
}

/** Remove Plus Codes from a Google formatted address. */
export function stripPlusCodes(value: string): string {
  return value
    .replace(PLUS_CODE_RE, '')
    .replace(/\s*,\s*,+/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function componentText(c: GoogleAddressComponent): string {
  return (c.long_name || c.longText || c.short_name || c.shortText || '').trim();
}

function findComponent(
  components: GoogleAddressComponent[],
  types: string[]
): string {
  for (const type of types) {
    const hit = components.find((c) => c.types?.includes(type));
    if (hit) {
      const text = componentText(hit);
      if (text) return text;
    }
  }
  return '';
}

function looksLikeVillageName(name: string): boolean {
  return /\burf\b/i.test(name) || name.split(/\s+/).length >= 4;
}

/**
 * Build street/area/city/state/pincode from Google address_components
 * (production path — never use Plus Code as street).
 */
export function parseFromGoogleComponents(
  components: GoogleAddressComponent[],
  formattedAddress?: string
): ParsedDeliveryAddress {
  const streetNumber = findComponent(components, ['street_number']);
  const route = findComponent(components, ['route']);
  const premise = findComponent(components, ['premise', 'subpremise']);
  const neighborhood = findComponent(components, [
    'neighborhood',
    'sublocality_level_2',
    'sublocality_level_3',
  ]);
  const area = findComponent(components, [
    'sublocality_level_1',
    'sublocality',
    'neighborhood',
  ]);
  const locality = findComponent(components, [
    'locality',
    'postal_town',
    'administrative_area_level_3',
    'administrative_area_level_2',
  ]);
  const cleanedFormatted = stripPlusCodes(formattedAddress ?? '');
  // Prefer known city tokens (e.g. Greater Noida) over village locality names.
  const preferredCity = extractCityFromAddress(cleanedFormatted) || '';
  const city =
    (preferredCity &&
    (!locality ||
      looksLikeVillageName(locality) ||
      preferredCity.toLowerCase() !== locality.toLowerCase())
      ? preferredCity
      : locality) ||
    preferredCity ||
    locality ||
    '';
  const state =
    findComponent(components, ['administrative_area_level_1']) ||
    STATE_NAMES.find((s) =>
      cleanedFormatted.toLowerCase().includes(s.toLowerCase())
    ) ||
    '';
  const pincode = findComponent(components, ['postal_code']) || '000000';

  let street = [streetNumber, route].filter(Boolean).join(' ').trim();
  if (!street && premise) street = premise;
  if (!street && neighborhood) street = neighborhood;
  if (!street && area) street = area;

  const cleanCity =
    normalizeCityName(city.replace(/\s+\d{6}\b/, '').trim()) ||
    preferredCity ||
    'City';

  if (!street || isPlusCodeToken(street)) {
    const parts = cleanedFormatted
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p && !isPlusCodeToken(p));
    const cityLower = cleanCity.toLowerCase();
    const beforeCity: string[] = [];
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower === cityLower) break;
      if (STATE_NAMES.some((s) => lower.includes(s.toLowerCase()))) break;
      if (lower === 'india' || /^\d{6}$/.test(part)) break;
      if (looksLikeVillageName(part) && beforeCity.length) break;
      beforeCity.push(part);
    }
    street =
      beforeCity.slice(0, 3).join(', ') ||
      parts[0] ||
      'Selected location';
  }

  const cleanArea =
    area && area.toLowerCase() !== cleanCity.toLowerCase()
      ? area
      : neighborhood && neighborhood.toLowerCase() !== cleanCity.toLowerCase()
        ? neighborhood
        : '';

  const display =
    cleanedFormatted ||
    [street, cleanArea, cleanCity, state, pincode !== '000000' ? pincode : '']
      .filter(Boolean)
      .join(', ');

  return {
    street,
    area: cleanArea || cleanCity,
    city: cleanCity,
    state: state || 'Madhya Pradesh',
    pincode: /^\d{6}$/.test(pincode) ? pincode : '000000',
    formattedAddress: display,
  };
}

/** Split a Google-style address into fields required by restaurant create/update. */
export function parseDeliveryAddress(input: {
  formattedAddress: string;
  label?: string;
  city?: string;
  lat?: number;
  lng?: number;
  components?: GoogleAddressComponent[];
}): ParsedDeliveryAddress {
  if (input.components?.length) {
    const fromComponents = parseFromGoogleComponents(
      input.components,
      input.formattedAddress || input.label
    );
    return {
      ...fromComponents,
      label: input.label,
      lat: input.lat,
      lng: input.lng,
      city:
        normalizeCityName(input.city) ||
        fromComponents.city,
    };
  }

  const formatted = stripPlusCodes(
    input.formattedAddress.trim() || input.label?.trim() || ''
  );
  const parts = formatted
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p && !isPlusCodeToken(p));

  const pincodeMatch = formatted.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch?.[1] ?? '000000';

  let state = 'Madhya Pradesh';
  for (const name of STATE_NAMES) {
    if (formatted.toLowerCase().includes(name.toLowerCase())) {
      state = name;
      break;
    }
  }

  const city =
    normalizeCityName(input.city) ||
    extractCityFromAddress(formatted) ||
    (parts.length >= 3 ? parts[parts.length - 3] : parts[parts.length - 2]) ||
    'City';

  const cityLower = city.toLowerCase();
  const beforeCity: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === cityLower) break;
    if (STATE_NAMES.some((s) => lower.includes(s.toLowerCase()))) break;
    if (lower === 'india' || /^\d{6}$/.test(part)) break;
    if (looksLikeVillageName(part) && beforeCity.length) break;
    beforeCity.push(part);
  }

  let street = '';
  const labelFirst = stripPlusCodes(input.label ?? '')
    .split(',')[0]
    ?.trim();
  if (
    labelFirst &&
    !isPlusCodeToken(labelFirst) &&
    labelFirst.toLowerCase() !== cityLower
  ) {
    street = labelFirst;
  }
  if (!street) {
    street = beforeCity.slice(0, 3).join(', ') || parts[0] || 'Selected location';
  }
  if (isPlusCodeToken(street.split(',')[0] ?? '')) {
    street = beforeCity.slice(0, 3).join(', ') || parts[0] || 'Selected location';
  }

  const areaCandidate =
    beforeCity.find(
      (p) =>
        !street.toLowerCase().includes(p.toLowerCase()) &&
        p.toLowerCase() !== cityLower
    ) ||
    parts.find(
      (p) =>
        p !== street &&
        p.toLowerCase() !== cityLower &&
        !STATE_NAMES.some((s) => p.toLowerCase().includes(s.toLowerCase())) &&
        !/^\d{6}$/.test(p) &&
        p.toLowerCase() !== 'india' &&
        !looksLikeVillageName(p)
    );

  return {
    street,
    area: areaCandidate || city,
    city: city.replace(/\s+\d{6}\b/, '').trim() || 'City',
    state,
    pincode,
    formattedAddress: formatted || street,
    label: input.label,
    lat: input.lat,
    lng: input.lng,
  };
}
