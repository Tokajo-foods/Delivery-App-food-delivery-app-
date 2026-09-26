import { CITIES_BY_STATE } from '@/lib/location/india-cities-data';
import {
  INDIA_STATES,
  matchIndiaState,
  searchIndiaStates,
} from '@/lib/location/india-states';

export {
  INDIA_STATES,
  matchIndiaState,
  searchIndiaStates,
  type IndiaState,
} from '@/lib/location/india-states';

export function citiesForState(state?: string | null): string[] {
  if (!state?.trim()) return [];
  const matched = matchIndiaState(state);
  const key = matched ?? state.trim();
  const list = CITIES_BY_STATE[key];
  return list ? [...list] : [];
}

export function searchCitiesForState(
  state: string | null | undefined,
  query: string
): string[] {
  const cities = citiesForState(state);
  const q = query.trim().toLowerCase();
  if (!q) return cities;
  return cities.filter((c) => c.toLowerCase().includes(q));
}

/** Match a free-text city against the catalog for a given state (or all states). */
export function matchIndiaCity(
  city?: string | null,
  state?: string | null
): string | null {
  if (!city?.trim()) return null;
  const needle = city.trim().toLowerCase();

  const scoped = citiesForState(state);
  if (scoped.length) {
    const hit = scoped.find((c) => c.toLowerCase() === needle);
    if (hit) return hit;
    const partial = scoped.find(
      (c) => needle.includes(c.toLowerCase()) || c.toLowerCase().includes(needle)
    );
    if (partial) return partial;
  }

  for (const s of INDIA_STATES) {
    const list = CITIES_BY_STATE[s] ?? [];
    const hit = list.find((c) => c.toLowerCase() === needle);
    if (hit) return hit;
  }
  return null;
}

/**
 * From reverse-geocode output, return catalog state/city when they match.
 * Does not invent street/area — those stay user-entered.
 */
export function matchCatalogGeo(input: {
  state?: string | null;
  city?: string | null;
  formattedAddress?: string | null;
}): { state: string | null; city: string | null } {
  const state =
    matchIndiaState(input.state) ||
    matchIndiaState(input.formattedAddress) ||
    null;

  const city =
    matchIndiaCity(input.city, state) ||
    (input.formattedAddress
      ? matchCityFromFormatted(input.formattedAddress, state)
      : null);

  return { state, city };
}

function matchCityFromFormatted(
  formatted: string,
  state: string | null
): string | null {
  const lower = formatted.toLowerCase();
  const cities = state ? citiesForState(state) : [];
  // Longer names first so "Greater Noida" wins over "Noida".
  const ranked = [...cities].sort((a, b) => b.length - a.length);
  for (const city of ranked) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  if (!state) {
    for (const s of INDIA_STATES) {
      const list = [...(CITIES_BY_STATE[s] ?? [])].sort(
        (a, b) => b.length - a.length
      );
      for (const city of list) {
        if (lower.includes(city.toLowerCase())) return city;
      }
    }
  }
  return null;
}
