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

function dedupeSuggestions(list: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];
  for (const item of list) {
    const key = `${item.placeId ?? ''}|${item.description}`
      .toLowerCase()
      .trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Google Places autocomplete only — keep Google’s ranking (no local re-score).
 */
export async function searchAddresses(
  query: string,
  options?: SearchAddressesOptions
): Promise<AddressSuggestion[]> {
  assertGoogleMapsApiKey();
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const bias = options?.bias;

  let google = await withTimeout(
    googlePlacesApi.autocomplete(trimmed, bias).catch(() => [] as AddressSuggestion[]),
    8000,
    [] as AddressSuggestion[]
  );

  if (!google.length) {
    google = await withTimeout(
      addressApi.autocomplete(trimmed).catch(() => [] as AddressSuggestion[]),
      3000,
      [] as AddressSuggestion[]
    );
  }

  return dedupeSuggestions(google).slice(0, 10);
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
