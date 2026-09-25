import { addressApi, type AddressSuggestion, type GeocodeResult } from '@/lib/address/api';
import {
  googlePlacesApi,
  type PlacesSearchBias,
} from '@/lib/address/google-places';
import { assertGoogleMapsApiKey } from '@/lib/google-maps';

export type SearchAddressesOptions = {
  bias?: PlacesSearchBias;
};

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, ms);
    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

/** Light typo helpers so India locality queries still hit Google Places. */
function buildQueryVariants(query: string): string[] {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);
  variants.add(trimmed.replace(/([a-zA-Z])\1{1,}/g, '$1$1'));
  variants.add(trimmed.replace(/([a-zA-Z])\1+/g, '$1'));

  const roadMatch = trimmed.match(/^(.+?)\s+road\s+(.+)$/i);
  if (roadMatch) {
    variants.add(`${roadMatch[1]} Road, ${roadMatch[2]}`);
    variants.add(`${roadMatch[1]} Road ${roadMatch[2]} Madhya Pradesh`);
  }

  if (
    !/madhya\s*pradesh|\bmp\b/i.test(trimmed) &&
    /tikamgarh|bhopal|indore|gwalior|jabalpur/i.test(trimmed)
  ) {
    variants.add(`${trimmed}, Madhya Pradesh`);
  }

  return [...variants].slice(0, 4);
}

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function tokenDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function scoreSuggestion(query: string, item: AddressSuggestion): number {
  const qTokens = normalizeTokens(query);
  if (!qTokens.length) return 1;
  const hay = normalizeTokens(
    `${item.mainText ?? ''} ${item.secondaryText ?? ''} ${item.description}`
  );
  if (!hay.length) return 0;

  let score = 0;
  for (const qt of qTokens) {
    let best = 0;
    for (const ht of hay) {
      if (ht === qt) best = Math.max(best, 12);
      else if (ht.startsWith(qt) || qt.startsWith(ht)) best = Math.max(best, 8);
      else if (tokenDistance(qt, ht) <= 1) best = Math.max(best, 6);
      else if (tokenDistance(qt, ht) <= 2) best = Math.max(best, 3);
    }
    score += best;
  }
  if (item.source?.startsWith('google')) score += 4;
  return score;
}

function dedupeSuggestions(list: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];
  for (const item of list) {
    const key = `${item.description}|${item.placeId ?? ''}|${item.lat ?? ''}|${item.lng ?? ''}`
      .toLowerCase()
      .trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Production place search — Google Places only (no OSM / Photon / Expo geocoder).
 */
export async function searchAddresses(
  query: string,
  options?: SearchAddressesOptions
): Promise<AddressSuggestion[]> {
  assertGoogleMapsApiKey();
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const bias = options?.bias;
  const variants = buildQueryVariants(trimmed);
  const primary = variants[0]!;
  const secondary = variants.find((v) => v !== primary);

  let google = await withTimeout(
    (async () => {
      const first = await googlePlacesApi.autocomplete(primary, bias);
      if (first.length) return first;
      if (secondary) return googlePlacesApi.autocomplete(secondary, bias);
      return [] as AddressSuggestion[];
    })().catch(() => [] as AddressSuggestion[]),
    7000,
    [] as AddressSuggestion[]
  );

  if (!google.length) {
    // Backend address-service may proxy Google; never OSM.
    google = await withTimeout(
      addressApi.autocomplete(primary).catch(() => [] as AddressSuggestion[]),
      3000,
      [] as AddressSuggestion[]
    );
  }

  const merged = dedupeSuggestions(google);
  return merged
    .map((item) => ({ item, score: scoreSuggestion(trimmed, item) }))
    .sort((a, b) => b.score - a.score)
    .filter((row) => row.score > 0 || merged.length <= 3)
    .slice(0, 10)
    .map((row) => row.item);
}

export async function geocodeAddress(input: {
  placeId?: string;
  address?: string;
  lat?: number;
  lng?: number;
}): Promise<GeocodeResult> {
  if (
    typeof input.lat === 'number' &&
    typeof input.lng === 'number' &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng)
  ) {
    return {
      lat: input.lat,
      lng: input.lng,
      formattedAddress: input.address,
    };
  }

  assertGoogleMapsApiKey();

  try {
    return await googlePlacesApi.geocode({
      placeId: input.placeId,
      address: input.address,
    });
  } catch (googleError) {
    try {
      return await addressApi.geocode(input);
    } catch {
      throw googleError instanceof Error
        ? googleError
        : new Error('Could not find this location on Google Maps');
    }
  }
}

/** Reverse geocode via Google Geocoding API (backend only as fallback). */
export async function reverseGeocodeAddress(input: {
  lat: number;
  lng: number;
}): Promise<string | null> {
  if (googlePlacesApi.isConfigured()) {
    const google = await googlePlacesApi.reverseGeocode(input);
    if (google) return google;
  }

  return addressApi.reverseGeocode(input);
}
