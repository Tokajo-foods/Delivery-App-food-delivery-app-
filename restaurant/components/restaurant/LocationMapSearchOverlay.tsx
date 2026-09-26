import { Crosshair, MapPin, Navigation, Search, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { locationMapPickerStyles as styles } from '@/components/restaurant/location-map-picker-styles';
import { theme } from '@/constants/theme';
import type { AddressSuggestion } from '@/lib/address/api';

type Props = {
  topInset: number;
  search: string;
  searching: boolean;
  locating: boolean;
  gpsReady: boolean;
  suggestions: AddressSuggestion[];
  searchError: string | null;
  currentLocationHint: string;
  onSearchChange: (text: string) => void;
  onSubmitSearch: () => void;
  onClose: () => void;
  onDetectLocation: () => void;
  onPickSuggestion: (item: AddressSuggestion) => void;
  onClearSearch: () => void;
};

export function LocationMapSearchOverlay({
  topInset,
  search,
  searching,
  locating,
  gpsReady,
  suggestions,
  searchError,
  currentLocationHint,
  onSearchChange,
  onSubmitSearch,
  onClose,
  onDetectLocation,
  onPickSuggestion,
  onClearSearch,
}: Props) {
  return (
    <View style={[styles.topSection, { paddingTop: topInset + 8 }]} pointerEvents="box-none">
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Search color={theme.secondaryLight} size={18} />
          <TextInput
            value={search}
            onChangeText={onSearchChange}
            onSubmitEditing={onSubmitSearch}
            placeholder="Search Google Maps"
            placeholderTextColor={theme.secondaryLight}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="words"
            clearButtonMode="while-editing"
          />
          {searching ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : search.length > 0 ? (
            <Pressable onPress={onClearSearch} hitSlop={8}>
              <X color={theme.secondaryLight} size={16} />
            </Pressable>
          ) : null}
        </View>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
          <X color={theme.secondary} size={20} />
        </Pressable>
      </View>

      {search.trim().length < 2 ? (
        <Pressable
          style={styles.currentLocationCard}
          onPress={onDetectLocation}
          disabled={locating}
        >
          <View style={styles.currentLocationIcon}>
            {locating ? (
              <ActivityIndicator color={theme.primary} size="small" />
            ) : (
              <Navigation color={theme.primary} size={18} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLocationTitle}>
              {locating
                ? 'Detecting your location…'
                : gpsReady
                  ? 'Using your current location'
                  : 'Use my current location'}
            </Text>
            <Text style={styles.currentLocationSub}>
              {gpsReady
                ? 'Pin is on you — confirm below or fine-tune on the map'
                : currentLocationHint}
            </Text>
          </View>
          <Crosshair color={theme.primary} size={18} />
        </Pressable>
      ) : (
        <View style={styles.suggestions}>
          {searching && suggestions.length === 0 ? (
            <View style={styles.searchingCard}>
              <ActivityIndicator color={theme.primary} size="small" />
              <Text style={styles.searchingText}>Searching Google Maps…</Text>
            </View>
          ) : null}

          {searchError && suggestions.length === 0 && !searching ? (
            <Text style={styles.searchErrorInline}>{searchError}</Text>
          ) : null}

          <ScrollView
            keyboardShouldPersistTaps="always"
            nestedScrollEnabled
            style={styles.suggestionsScroll}
          >
            {suggestions.slice(0, 10).map((item, index) => (
              <Pressable
                key={`${item.placeId ?? item.description}-${index}`}
                onPress={() => onPickSuggestion(item)}
                style={[
                  styles.suggestionRow,
                  index === Math.min(suggestions.length, 10) - 1 &&
                    styles.suggestionRowLast,
                ]}
              >
                <View style={styles.suggestionIcon}>
                  <MapPin color={theme.primary} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {String(item.mainText || item.description.split(',')[0])}
                  </Text>
                  <Text style={styles.suggestionSecondary} numberOfLines={2}>
                    {String(
                      item.secondaryText ||
                        item.description.split(',').slice(1).join(',').trim() ||
                        item.description
                    )}
                  </Text>
                </View>
              </Pressable>
            ))}
            {suggestions.length > 0 ? (
              <Text style={styles.poweredBy}>Powered by Google Maps</Text>
            ) : null}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
