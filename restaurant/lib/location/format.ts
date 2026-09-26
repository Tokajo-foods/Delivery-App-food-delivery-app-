/** Normalize longitude into [-180, 180] (Google Maps can return unwrapped values). */
export function normalizeLng(lng: number): number {
  if (!Number.isFinite(lng)) return lng;
  let x = lng;
  while (x > 180) x -= 360;
  while (x < -180) x += 360;
  return x;
}

export function normalizeLat(lat: number): number {
  if (!Number.isFinite(lat)) return lat;
  return Math.max(-90, Math.min(90, lat));
}

export function isCoordinateFallbackAddress(value?: string | null): boolean {
  if (!value) return false;
  return /^lat\s*-?\d/i.test(value.trim()) || /\blng\s*-?\d/i.test(value);
}

/** Short label shown in the header (e.g. "Koramangala" or "Home"). */
export function shortAddressLabel(formattedAddress: string, source?: string): string {
  if (!formattedAddress.trim() || isCoordinateFallbackAddress(formattedAddress)) {
    return source === 'gps' ? 'Current location' : 'Selected location';
  }

  const cleaned = formattedAddress
    .replace(/\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}\b/gi, '')
    .replace(/\s*,\s*,+/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();

  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return source === 'gps' ? 'Current location' : 'Selected location';
  if (parts.length === 1) return parts[0];

  const first = parts[0];
  const second = parts[1];

  if (/^\d/.test(first) && second) {
    return `${first}, ${second}`;
  }

  return first.length <= 36 ? first : `${first.slice(0, 33)}…`;
}

/** Extract city name from a full formatted address (e.g. Google reverse geocode). */
export function extractCityFromAddress(formattedAddress: string): string | null {
  if (!formattedAddress.trim() || isCoordinateFallbackAddress(formattedAddress)) {
    return null;
  }

  const plusCodeRe = /\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}\b/gi;

  const parts = formattedAddress
    .replace(plusCodeRe, '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((part) => {
      if (/^lat\b/i.test(part) || /^lng\b/i.test(part)) return false;
      if (/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}$/i.test(part)) return false;
      return true;
    });

  if (parts.length === 0) return null;

  // Prefer well-known NCR / metro city tokens when present in the string.
  const preferredCities = [
    'Greater Noida',
    'Noida',
    'New Delhi',
    'Delhi',
    'Gurgaon',
    'Gurugram',
    'Ghaziabad',
    'Faridabad',
    'Bengaluru',
    'Bangalore',
    'Mumbai',
    'Pune',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Jaipur',
    'Ahmedabad',
    'Lucknow',
    'Indore',
    'Bhopal',
    'Gwalior',
    'Tikamgarh',
  ];
  const lowerFull = formattedAddress.toLowerCase();
  for (const city of preferredCities) {
    if (lowerFull.includes(city.toLowerCase())) return city;
  }

  const stateHints = [
    'madhya pradesh',
    'uttar pradesh',
    'andhra pradesh',
    'arunachal pradesh',
    'himachal pradesh',
    'tamil nadu',
    'west bengal',
    'maharashtra',
    'karnataka',
    'gujarat',
    'rajasthan',
    'punjab',
    'haryana',
    'bihar',
    'odisha',
    'kerala',
    'telangana',
    'assam',
    'delhi',
    'india',
  ];

  // Walk from the end: skip country / state / pin, take locality (not village urf-nawada fragments after city).
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const raw = parts[i];
    const lower = raw.toLowerCase().replace(/\d+/g, '').trim();
    if (stateHints.some((h) => lower.includes(h))) continue;
    if (/^\d{5,6}$/.test(raw)) continue;
    if (raw.length < 3) continue;
    if (/^\d/.test(raw) && raw.length < 8) continue;
    // Skip "X Urf Y" village strings when a better city token exists earlier
    if (/\burf\b/i.test(raw) && i > 0) continue;
    return raw.replace(/\s+\d{5,6}$/, '').trim();
  }

  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

export function headerLocationLine(label: string, formattedAddress: string): string {
  if (isCoordinateFallbackAddress(formattedAddress) || isCoordinateFallbackAddress(label)) {
    return 'Current location';
  }
  const short = shortAddressLabel(formattedAddress);
  if (label && label !== short && !formattedAddress.startsWith(label)) {
    return `${label} · ${short}`;
  }
  return short;
}

/**
 * Full delivery address for the home header (Swiggy/Zomato style).
 * Keeps street → city → state; drops trailing country noise.
 */
export function formatFullDeliveryAddress(formattedAddress?: string | null): string {
  if (!formattedAddress?.trim() || isCoordinateFallbackAddress(formattedAddress)) {
    return '';
  }

  const cleaned = formattedAddress
    .replace(/\b[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}\b/gi, '')
    .replace(/\s*,\s*,+/g, ',')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim();

  const parts = cleaned
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((part) => {
      const lower = part.toLowerCase();
      if (lower === 'india' || lower === 'in') return false;
      if (/^lat\b/i.test(part) || /^lng\b/i.test(part)) return false;
      if (/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3}$/i.test(part)) return false;
      return true;
    });

  return parts.join(', ');
}

/** Primary line under "Deliver to" — locality / landmark. */
export function deliveryHeaderTitle(
  label?: string | null,
  formattedAddress?: string | null
): string {
  if (label && !isCoordinateFallbackAddress(label) && label !== 'Selected location') {
    // Prefer a concise label when it's not already the entire address
    if (
      !formattedAddress ||
      label.length <= 36 ||
      !formattedAddress.toLowerCase().startsWith(label.toLowerCase())
    ) {
      const first = label.split(',')[0]?.trim();
      if (first) return first;
    }
  }

  const full = formatFullDeliveryAddress(formattedAddress);
  if (!full) return 'Set delivery address';
  return full.split(',')[0]?.trim() || full;
}

/** Secondary line — remaining full address after the title. */
export function deliveryHeaderSubtitle(
  title: string,
  formattedAddress?: string | null
): string {
  const full = formatFullDeliveryAddress(formattedAddress);
  if (!full) return '';

  // If title is the start of the full address, show the rest
  const lowerFull = full.toLowerCase();
  const lowerTitle = title.toLowerCase();
  if (lowerFull.startsWith(lowerTitle)) {
    const rest = full.slice(title.length).replace(/^[\s,]+/, '');
    return rest;
  }

  // Otherwise show full address (user selected this exact place)
  if (full.toLowerCase() === lowerTitle) return '';
  return full;
}

/** Clean city labels like "Tikamgarh Tahsil" → "Tikamgarh". */
export function normalizeCityName(city?: string | null): string | undefined {
  if (!city?.trim()) return undefined;
  if (isCoordinateFallbackAddress(city) || /^lng\b/i.test(city)) return undefined;

  const cleaned = city
    .replace(/\s+\d{5,6}\b/g, '')
    .replace(
      /\s+(tahsil|tehsil|district|nagar parishad|municipal corporation|municipality|corp\.?)\b/gi,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 2) return undefined;
  return cleaned;
}

/** True when a restaurant belongs to the user's selected delivery city. */
export function restaurantMatchesCity(
  restaurant: { city?: string | null; address?: string | null },
  city: string
): boolean {
  const needle = normalizeCityName(city)?.toLowerCase();
  if (!needle) return false;

  const hay = `${restaurant.city ?? ''} ${restaurant.address ?? ''}`.toLowerCase();
  if (hay.includes(needle)) return true;

  // Handle minor spacing / punctuation differences
  const compactHay = hay.replace(/[^a-z0-9]/g, '');
  const compactNeedle = needle.replace(/[^a-z0-9]/g, '');
  return compactHay.includes(compactNeedle);
}

