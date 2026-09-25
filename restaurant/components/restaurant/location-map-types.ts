export type MapPickResult = {
  lat: number;
  lng: number;
  formattedAddress: string;
  label: string;
  source: 'gps' | 'search';
};
