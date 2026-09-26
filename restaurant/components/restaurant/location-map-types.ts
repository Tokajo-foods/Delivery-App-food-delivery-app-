export type MapPickResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
  label: string;
  source: 'gps' | 'search';
  components?: Array<{
    long_name?: string;
    short_name?: string;
    types: string[];
  }>;
};
