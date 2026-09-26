import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { Keyboard } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';

import type { AddressSuggestion } from '@/lib/address/api';
import { geocodeAddress } from '@/lib/address/search';
import { getApiErrorMessage } from '@/lib/errors';
import { normalizeLat, normalizeLng, shortAddressLabel } from '@/lib/location/format';

import type { MapPickResult } from '@/components/restaurant/location-map-types';

type Pending = { id: number; kind: 'autocomplete' | 'details' | 'geocode' } | null;

type Ctx = {
  search: string;
  requestIdRef: MutableRefObject<number>;
  pendingRequest: MutableRefObject<Pending>;
  confirmPending: MutableRefObject<boolean>;
  detectedRef: MutableRefObject<string | undefined>;
  sourceRef: MutableRefObject<'gps' | 'search'>;
  setMapReady: (v: boolean) => void;
  setPin: (v: { lat: number; lng: number }) => void;
  setDetectedAddress: (v: string | undefined) => void;
  setGpsReady: (v: boolean) => void;
  setSuggestions: Dispatch<SetStateAction<AddressSuggestion[]>>;
  setSearching: (v: boolean) => void;
  setSearchError: (v: string | null) => void;
  setSearch: (v: string) => void;
  setError: (v: string | null) => void;
  reverseLookup: (lat: number, lng: number) => void;
  applyCoords: (
    lat: number,
    lng: number,
    source: 'gps' | 'search',
    formatted?: string
  ) => Promise<void>;
  onConfirm: (result: MapPickResult) => void;
};

export function handleLocationMapWebMessage(
  event: WebViewMessageEvent,
  ctx: Ctx
): void {
  try {
    const msg = JSON.parse(event.nativeEvent.data);
    if (msg.type === 'ready') {
      ctx.setMapReady(true);
      return;
    }
    if (msg.type === 'move' && typeof msg.lat === 'number') {
      const lat = normalizeLat(msg.lat);
      const lng = normalizeLng(msg.lng);
      ctx.setPin({ lat, lng });
      ctx.setDetectedAddress(undefined);
      ctx.setGpsReady(false);
      ctx.sourceRef.current = 'search';
      ctx.reverseLookup(lat, lng);
      return;
    }
    if (msg.type === 'autocompleteResults') {
      const matchesRequest =
        ctx.pendingRequest.current?.id === msg.requestId ||
        msg.requestId === ctx.requestIdRef.current;
      if (!matchesRequest) return;

      if (
        msg.status === 'OK' &&
        Array.isArray(msg.predictions) &&
        msg.predictions.length
      ) {
        ctx.pendingRequest.current = null;
        const mapped: AddressSuggestion[] = msg.predictions.map(
          (p: {
            description: string;
            placeId: string;
            mainText?: string;
            secondaryText?: string;
          }) => ({
            description: p.description,
            placeId: p.placeId,
            mainText: p.mainText,
            secondaryText: p.secondaryText,
            source: 'google-maps',
          })
        );
        ctx.setSuggestions(mapped.slice(0, 10));
        ctx.setSearching(false);
        ctx.setSearchError(null);
        return;
      }

      if (msg.status === 'REQUEST_DENIED' || msg.status === 'INVALID_REQUEST') {
        ctx.setSearchError(
          'Google Maps search is blocked for this API key. Enable Places API (and Maps JavaScript API) in Google Cloud.'
        );
      }
      // ZERO_RESULTS / empty — leave searching on so Places REST backup can fill.
      return;
    }
    if (msg.type === 'placeDetailsResult') {
      if (ctx.pendingRequest.current?.id !== msg.requestId) return;
      ctx.pendingRequest.current = null;
      ctx.setSearching(false);
      if (msg.ok) {
        void ctx.applyCoords(msg.lat, msg.lng, 'search', msg.formattedAddress);
        ctx.setSuggestions([]);
        Keyboard.dismiss();
        return;
      }
      ctx.setError('Could not open that place. Try another suggestion.');
      return;
    }
    if (msg.type === 'geocodeTextResult') {
      if (ctx.pendingRequest.current?.id !== msg.requestId) return;
      ctx.pendingRequest.current = null;
      ctx.setSearching(false);
      if (msg.ok) {
        void ctx.applyCoords(msg.lat, msg.lng, 'search', msg.formattedAddress);
        ctx.setSuggestions([]);
        ctx.setSearch(msg.formattedAddress || ctx.search);
        Keyboard.dismiss();
        return;
      }
      void (async () => {
        try {
          const geo = await geocodeAddress({ address: ctx.search.trim() });
          await ctx.applyCoords(
            geo.lat,
            geo.lng,
            'search',
            geo.formattedAddress ?? ctx.search.trim()
          );
          ctx.setSuggestions([]);
        } catch (err) {
          ctx.setSearchError(
            getApiErrorMessage(err, 'No Google Maps results for that address')
          );
        }
      })();
      return;
    }
    if (
      msg.type === 'confirm' &&
      ctx.confirmPending.current &&
      typeof msg.lat === 'number' &&
      typeof msg.lng === 'number'
    ) {
      ctx.confirmPending.current = false;
      const formatted =
        ctx.detectedRef.current ??
        `Lat ${msg.lat.toFixed(5)}, Lng ${msg.lng.toFixed(5)}`;
      ctx.onConfirm({
        lat: msg.lat,
        lng: msg.lng,
        formattedAddress: formatted,
        label: shortAddressLabel(formatted, ctx.sourceRef.current),
        source: ctx.sourceRef.current,
      });
    }
  } catch {
    // ignore malformed messages
  }
}
