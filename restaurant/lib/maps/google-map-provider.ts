import { PROVIDER_GOOGLE } from 'react-native-maps';

/**
 * Always use Google Maps tiles (never Apple MapKit / default Expo map).
 * Requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in app.config ios/android config.
 */
export const GOOGLE_MAP_PROVIDER = PROVIDER_GOOGLE;
