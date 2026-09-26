import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import type { WebView, WebViewMessageEvent } from 'react-native-webview';

import type { AddressSuggestion } from '@/lib/address/api';
import {
  geocodeAddress,
  reverseGeocodeAddress,
  searchAddresses,
} from '@/lib/address/search';
import { getApiErrorMessage } from '@/lib/errors';
import { assertGoogleMapsApiKey, GOOGLE_MAPS_API_KEY } from '@/lib/google-maps';
import {
  isCoordinateFallbackAddress,
  normalizeLat,
  normalizeLng,
  shortAddressLabel,
} from '@/lib/location/format';
import {
  stripPlusCodes,
  type GoogleAddressComponent,
} from '@/lib/location/parse-address';

import type { MapPickResult } from '@/components/restaurant/location-map-types';
import { handleLocationMapWebMessage } from '@/components/restaurant/location-map-webview-messages';

const DEFAULT = { lat: 23.2599, lng: 77.4126 };

type Args = {
  visible: boolean;
  initial?: { lat: number; lng: number } | null;
  autoDetectOnOpen: boolean;
  onConfirm: (result: MapPickResult) => void;
};

function cleanDisplayAddress(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined;
  if (isCoordinateFallbackAddress(value)) return undefined;
  const cleaned = stripPlusCodes(value);
  return cleaned || undefined;
}

export function useLocationMapPicker({
  visible,
  initial,
  autoDetectOnOpen,
  onConfirm,
}: Args) {
  const webRef = useRef<WebView>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmPending = useRef(false);
  const detectedRef = useRef<string | undefined>(undefined);
  const componentsRef = useRef<GoogleAddressComponent[]>([]);
  const sourceRef = useRef<'gps' | 'search'>('search');
  const requestIdRef = useRef(0);
  const pendingRequest = useRef<{
    id: number;
    kind: 'autocomplete' | 'details' | 'geocode';
  } | null>(null);
  const reverseSeq = useRef(0);

  const startPoint = useMemo(() => initial ?? DEFAULT, [initial]);

  const [pin, setPin] = useState(startPoint);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [addressUpdating, setAddressUpdating] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [gpsReady, setGpsReady] = useState(false);

  detectedRef.current = detectedAddress;

  const sendToMap = useCallback((lat: number, lng: number, zoom = 17) => {
    if (!webRef.current) return;
    webRef.current.injectJavaScript(`
      (function() {
        try {
          if (typeof setMapView === 'function') {
            setMapView(${lat}, ${lng}, ${zoom});
          } else if (map) {
            map.setCenter({ lat: ${lat}, lng: ${lng} });
            map.setZoom(${zoom});
          }
        } catch (e) {}
      })();
      true;
    `);
  }, []);

  const reverseLookup = useCallback((lat: number, lng: number) => {
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    const seq = ++reverseSeq.current;
    setAddressUpdating(true);
    reverseTimer.current = setTimeout(async () => {
      const result = await reverseGeocodeAddress({ lat, lng });
      if (seq !== reverseSeq.current) return;
      if (result?.formattedAddress) {
        componentsRef.current = result.components ?? [];
        setDetectedAddress(result.formattedAddress);
      }
      setAddressUpdating(false);
    }, 450);
  }, []);

  const applyCoords = useCallback(
    async (
      lat: number,
      lng: number,
      source: 'gps' | 'search',
      formatted?: string
    ) => {
      const safeLat = normalizeLat(lat);
      const safeLng = normalizeLng(lng);
      sourceRef.current = source;
      setPin({ lat: safeLat, lng: safeLng });
      sendToMap(safeLat, safeLng, 17);
      setTimeout(() => sendToMap(safeLat, safeLng, 17), 350);

      const cleaned = cleanDisplayAddress(formatted);
      if (cleaned) {
        componentsRef.current = [];
        setDetectedAddress(cleaned);
        setAddressUpdating(false);
        // Still enrich with components in background (street/city parse).
        void reverseGeocodeAddress({ lat: safeLat, lng: safeLng }).then(
          (result) => {
            if (!result) return;
            componentsRef.current = result.components ?? [];
            if (result.formattedAddress) {
              setDetectedAddress(result.formattedAddress);
            }
          }
        );
        return;
      }

      setAddressUpdating(true);
      const result = await reverseGeocodeAddress({
        lat: safeLat,
        lng: safeLng,
      });
      componentsRef.current = result?.components ?? [];
      setDetectedAddress(
        result?.formattedAddress || 'Selected location'
      );
      setAddressUpdating(false);
    },
    [sendToMap]
  );

  const detectCurrentLocation = useCallback(async () => {
    setLocating(true);
    setGpsReady(false);
    setError(null);
    setSearchError(null);
    setSuggestions([]);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Allow location access to use your current position.');
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError('Turn on GPS / device location, then try again.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await applyCoords(pos.coords.latitude, pos.coords.longitude, 'gps');
      setGpsReady(true);
      setSearch('');
    } catch {
      setError('Could not detect your location. Search for an address instead.');
    } finally {
      setLocating(false);
    }
  }, [applyCoords]);

  useEffect(() => {
    if (!visible) {
      setMapReady(false);
      setGpsReady(false);
      return;
    }
    setError(null);
    setSearchError(null);
    setSuggestions([]);
    setSearch('');
    setPin(startPoint);
    setDetectedAddress(undefined);
    setGpsReady(false);
    sourceRef.current = 'search';
    try {
      assertGoogleMapsApiKey();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google Maps API key is missing. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and restart Expo.'
      );
    }
  }, [visible, startPoint]);

  useEffect(() => {
    if (!visible || !mapReady) return;
    if (autoDetectOnOpen) {
      void detectCurrentLocation();
      return;
    }
    if (initial) {
      sendToMap(initial.lat, initial.lng);
      reverseLookup(initial.lat, initial.lng);
    }
  }, [
    visible,
    mapReady,
    autoDetectOnOpen,
    initial,
    detectCurrentLocation,
    sendToMap,
    reverseLookup,
  ]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
    };
  }, []);

  const runGoogleAutocomplete = useCallback(
    async (query: string, requestId: number) => {
      setSearching(true);
      setSearchError(null);
      try {
        // Long / multi-part queries: search India-wide (no pin bias), like Google Maps.
        const looksBroad =
          query.length >= 16 || /,/.test(query) || /\d{5,6}/.test(query);
        const res = await searchAddresses(
          query,
          looksBroad
            ? undefined
            : { bias: { lat: pin.lat, lng: pin.lng, radiusMeters: 80000 } }
        );
        if (requestId !== requestIdRef.current) return;
        setSuggestions((prev) => (prev.length ? prev : res));
        if (res.length === 0) {
          setSuggestions((prev) => {
            if (prev.length) return prev;
            setSearchError(
              'No Google Maps places found. Try a fuller address (area + city).'
            );
            return prev;
          });
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setSuggestions((prev) => {
          if (prev.length) return prev;
          setSearchError(
            getApiErrorMessage(err, 'Could not load Google Maps suggestions')
          );
          return prev;
        });
      } finally {
        if (requestId === requestIdRef.current) setSearching(false);
      }
    },
    [pin.lat, pin.lng]
  );

  const askWebViewAutocomplete = useCallback(
    (query: string, requestId: number) => {
      if (!GOOGLE_MAPS_API_KEY || !mapReady || !webRef.current) return;
      pendingRequest.current = { id: requestId, kind: 'autocomplete' };
      const payload = JSON.stringify({
        type: 'autocomplete',
        query,
        requestId,
        lat: pin.lat,
        lng: pin.lng,
        radius: 50000,
      });
      webRef.current.injectJavaScript(`
      (function() {
        try {
          if (typeof handleRN === 'function') {
            handleRN({ data: ${JSON.stringify(payload)} });
          }
        } catch (e) {}
      })();
      true;
    `);
    },
    [mapReady, pin.lat, pin.lng]
  );

  const askWebViewPlaceDetails = useCallback(
    (placeId: string, requestId: number) => {
      if (!mapReady || !webRef.current || !placeId) return false;
      pendingRequest.current = { id: requestId, kind: 'details' };
      const payload = JSON.stringify({
        type: 'placeDetails',
        placeId,
        requestId,
      });
      webRef.current.injectJavaScript(`
      (function() {
        try {
          if (typeof handleRN === 'function') {
            handleRN({ data: ${JSON.stringify(payload)} });
          }
        } catch (e) {}
      })();
      true;
    `);
      return true;
    },
    [mapReady]
  );

  const askWebViewGeocode = useCallback(
    (query: string, requestId: number) => {
      if (!mapReady || !webRef.current) return false;
      pendingRequest.current = { id: requestId, kind: 'geocode' };
      const payload = JSON.stringify({
        type: 'geocodeText',
        query,
        requestId,
      });
      webRef.current.injectJavaScript(`
      (function() {
        try {
          if (typeof handleRN === 'function') {
            handleRN({ data: ${JSON.stringify(payload)} });
          }
        } catch (e) {}
      })();
      true;
    `);
      return true;
    },
    [mapReady]
  );

  const onSearchChange = (text: string) => {
    setSearch(text);
    setSearchError(null);
    setGpsReady(false);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      setSearching(false);
      pendingRequest.current = null;
      return;
    }
    searchTimer.current = setTimeout(() => {
      const query = text.trim();
      const id = ++requestIdRef.current;
      setSearching(true);
      setSuggestions([]);
      // Google Maps JS Autocomplete first (same engine as maps.google.com).
      askWebViewAutocomplete(query, id);
      // Places REST backup if WebView is slow / empty.
      void runGoogleAutocomplete(query, id);
    }, 250);
  };

  const onMapMessage = (event: WebViewMessageEvent) => {
    handleLocationMapWebMessage(event, {
      search,
      requestIdRef,
      pendingRequest,
      confirmPending,
      detectedRef,
      sourceRef,
      setMapReady,
      setPin,
      setDetectedAddress,
      setGpsReady,
      setSuggestions,
      setSearching,
      setSearchError,
      setSearch,
      setError,
      reverseLookup,
      applyCoords,
      onConfirm,
    });
  };

  const pickSuggestion = async (item: AddressSuggestion) => {
    Keyboard.dismiss();
    setSuggestions([]);
    setSearch(item.description);
    setSearching(true);
    setSearchError(null);
    setError(null);
    setGpsReady(false);
    let waitingOnMap = false;
    try {
      const lat = typeof item.lat === 'number' ? item.lat : undefined;
      const lng = typeof item.lng === 'number' ? item.lng : undefined;
      if (
        lat != null &&
        lng != null &&
        Number.isFinite(lat) &&
        Number.isFinite(lng)
      ) {
        await applyCoords(lat, lng, 'search', item.description);
        return;
      }

      // Resolve pin via Google Maps PlacesService in the WebView (same place_id).
      if (item.placeId) {
        const id = ++requestIdRef.current;
        const asked = askWebViewPlaceDetails(item.placeId, id);
        if (asked) {
          waitingOnMap = true;
          return;
        }
      }

      const geo = await geocodeAddress({
        placeId: item.placeId,
        address: item.description,
      });
      await applyCoords(
        geo.lat,
        geo.lng,
        'search',
        geo.formattedAddress ?? item.description
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to open this place on Google Maps'));
    } finally {
      if (!waitingOnMap) setSearching(false);
    }
  };

  const submitSearch = () => {
    const query = search.trim();
    if (query.length < 2) return;
    Keyboard.dismiss();
    setSuggestions([]);
    setSearching(true);
    setSearchError(null);
    setError(null);
    const id = ++requestIdRef.current;
    const asked = askWebViewGeocode(query, id);
    if (asked) return;
    void (async () => {
      try {
        const geo = await geocodeAddress({ address: query });
        await applyCoords(
          geo.lat,
          geo.lng,
          'search',
          geo.formattedAddress ?? query
        );
        if (geo.formattedAddress) setSearch(geo.formattedAddress);
      } catch (err) {
        setSearchError(
          getApiErrorMessage(err, 'No Google Maps results for that address')
        );
      } finally {
        setSearching(false);
      }
    })();
  };

  const handleConfirm = () => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError(
        'Google Maps API key is missing. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and restart Expo.'
      );
      return;
    }
    const formatted =
      cleanDisplayAddress(detectedAddress) || 'Selected location';
    onConfirm({
      lat: pin.lat,
      lng: pin.lng,
      formattedAddress: formatted,
      label: shortAddressLabel(formatted, sourceRef.current),
      source: sourceRef.current,
      components: componentsRef.current.length
        ? componentsRef.current
        : undefined,
    });
  };

  return {
    webRef,
    startPoint,
    pin,
    search,
    suggestions,
    searching,
    locating,
    addressUpdating,
    detectedAddress,
    error,
    searchError,
    gpsReady,
    onSearchChange,
    onMapMessage,
    pickSuggestion,
    submitSearch,
    handleConfirm,
    detectCurrentLocation,
    setSearch,
    setSuggestions,
    setSearchError,
  };
}
