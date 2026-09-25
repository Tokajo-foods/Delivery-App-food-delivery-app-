import { Check, MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { buildGoogleMapHtml } from '@/components/restaurant/location-map-html';
import { locationMapPickerStyles as styles } from '@/components/restaurant/location-map-picker-styles';
import type { MapPickResult } from '@/components/restaurant/location-map-types';
import { LocationMapSearchOverlay } from '@/components/restaurant/LocationMapSearchOverlay';
import { useLocationMapPicker } from '@/components/restaurant/useLocationMapPicker';
import { theme } from '@/constants/theme';
import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';

export type { MapPickResult } from '@/components/restaurant/location-map-types';

type LocationMapPickerProps = {
  visible: boolean;
  initial?: { lat: number; lng: number } | null;
  autoDetectOnOpen?: boolean;
  locationTitle?: string;
  currentLocationHint?: string;
  onClose: () => void;
  onConfirm: (result: MapPickResult) => void;
};

/**
 * Restaurant / rider location picker — Google Maps JS + Places (no Expo / Apple maps).
 */
export function LocationMapPicker({
  visible,
  initial,
  autoDetectOnOpen = true,
  locationTitle = 'RESTAURANT LOCATION',
  currentLocationHint = 'Use your current GPS position for the restaurant',
  onClose,
  onConfirm,
}: LocationMapPickerProps) {
  const insets = useSafeAreaInsets();
  const picker = useLocationMapPicker({
    visible,
    initial,
    autoDetectOnOpen,
    onConfirm,
  });

  const mapHtml = useMemo(
    () =>
      GOOGLE_MAPS_API_KEY
        ? buildGoogleMapHtml(
            picker.startPoint.lat,
            picker.startPoint.lng,
            GOOGLE_MAPS_API_KEY
          )
        : '',
    [picker.startPoint.lat, picker.startPoint.lng]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <View style={styles.mapPane}>
          {visible && GOOGLE_MAPS_API_KEY ? (
            <WebView
              ref={picker.webRef}
              style={styles.map}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              onMessage={picker.onMapMessage}
              javaScriptEnabled
              domStorageEnabled
              geolocationEnabled
              startInLoadingState
              renderLoading={() => (
                <View style={styles.mapLoading}>
                  <ActivityIndicator color={theme.primary} size="large" />
                  <Text style={styles.mapLoadingText}>Loading Google Maps…</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.mapFallback}>
              <MapPin color={theme.primary} size={40} />
              <Text style={styles.mapFallbackTitle}>
                {GOOGLE_MAPS_API_KEY
                  ? 'Preparing Google Maps…'
                  : 'Google Maps key missing'}
              </Text>
              <Text style={styles.mapFallbackText}>
                {GOOGLE_MAPS_API_KEY
                  ? 'Use current location or search for an address below.'
                  : 'Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env (Maps SDK, Places, Geocoding) and restart Expo.'}
              </Text>
            </View>
          )}

          <LocationMapSearchOverlay
            topInset={insets.top}
            search={picker.search}
            searching={picker.searching}
            locating={picker.locating}
            gpsReady={picker.gpsReady}
            suggestions={picker.suggestions}
            searchError={picker.searchError}
            currentLocationHint={currentLocationHint}
            onSearchChange={picker.onSearchChange}
            onSubmitSearch={picker.submitSearch}
            onClose={onClose}
            onDetectLocation={() => void picker.detectCurrentLocation()}
            onPickSuggestion={(item) => void picker.pickSuggestion(item)}
            onClearSearch={() => {
              picker.setSearch('');
              picker.setSuggestions([]);
              picker.setSearchError(null);
            }}
          />
        </View>

        <View
          style={[
            styles.bottomPanel,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {picker.error ? (
            <Text style={styles.errorText}>{picker.error}</Text>
          ) : null}
          <View style={styles.detectedRow}>
            <MapPin color={theme.primary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detectedLabel}>{locationTitle}</Text>
              <Text style={styles.detectedValue} numberOfLines={2}>
                {picker.locating && !picker.detectedAddress
                  ? 'Getting your address…'
                  : picker.detectedAddress ??
                    `Lat ${picker.pin.lat.toFixed(5)}, Lng ${picker.pin.lng.toFixed(5)}`}
              </Text>
              <Text style={styles.detectedHint}>
                Drag the map to fine-tune · or search Google Places above
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={picker.handleConfirm}
            disabled={
              (picker.locating && !picker.detectedAddress) || !GOOGLE_MAPS_API_KEY
            }
            style={{
              marginTop: 14,
              height: 54,
              borderRadius: 14,
              backgroundColor: theme.primary,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              opacity:
                (picker.locating && !picker.detectedAddress) ||
                !GOOGLE_MAPS_API_KEY
                  ? 0.6
                  : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Confirm location"
          >
            {picker.locating && !picker.detectedAddress ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Check color="#FFFFFF" size={20} strokeWidth={2.5} />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 16,
                    fontWeight: '800',
                    color: '#FFFFFF',
                  }}
                >
                  Confirm location
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
