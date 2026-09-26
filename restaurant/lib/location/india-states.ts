/** All Indian states and union territories (official names). */
export const INDIA_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export type IndiaState = (typeof INDIA_STATES)[number];

const STATE_ALIASES: Record<string, IndiaState> = {
  up: 'Uttar Pradesh',
  'u.p.': 'Uttar Pradesh',
  'uttar pradesh': 'Uttar Pradesh',
  mp: 'Madhya Pradesh',
  'm.p.': 'Madhya Pradesh',
  'madhya pradesh': 'Madhya Pradesh',
  'andhra': 'Andhra Pradesh',
  'ap': 'Andhra Pradesh',
  'tn': 'Tamil Nadu',
  'tamilnadu': 'Tamil Nadu',
  'tamil nadu': 'Tamil Nadu',
  'wb': 'West Bengal',
  'west bengal': 'West Bengal',
  'nct of delhi': 'Delhi',
  'new delhi': 'Delhi',
  'delhi ncr': 'Delhi',
  'orissa': 'Odisha',
  'pondicherry': 'Puducherry',
  'uttaranchal': 'Uttarakhand',
  'jammu & kashmir': 'Jammu and Kashmir',
  'j&k': 'Jammu and Kashmir',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
};

export function matchIndiaState(value?: string | null): IndiaState | null {
  if (!value?.trim()) return null;
  const raw = value.trim();
  const lower = raw.toLowerCase();

  const alias = STATE_ALIASES[lower];
  if (alias) return alias;

  const exact = INDIA_STATES.find((s) => s.toLowerCase() === lower);
  if (exact) return exact;

  const partial = INDIA_STATES.find(
    (s) => lower.includes(s.toLowerCase()) || s.toLowerCase().includes(lower)
  );
  return partial ?? null;
}

export function searchIndiaStates(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...INDIA_STATES];
  return INDIA_STATES.filter((s) => s.toLowerCase().includes(q));
}
