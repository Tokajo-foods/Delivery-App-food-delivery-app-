import { FileUp, Search, UtensilsCrossed, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

type BrowserCategory = { id: string; name: string };

type Props = {
  search: string;
  onSearch: (value: string) => void;
  onImport: () => void;
  importDisabled?: boolean;
  categoriesLoading?: boolean;
  categories: BrowserCategory[];
  selectedCategoryId: string | null;
  allCount: number;
  itemCountByCategory: Map<string, number>;
  onSelectCategory: (categoryId: string | null) => void;
  soldOutCount: number;
  soldOutOnly: boolean;
  onToggleSoldOut: () => void;
};

function IconButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.iconBtn, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}

export function MenuBrowserBar({
  search,
  onSearch,
  onImport,
  importDisabled,
  categoriesLoading,
  categories,
  selectedCategoryId,
  allCount,
  itemCountByCategory,
  onSelectCategory,
  soldOutCount,
  soldOutOnly,
  onToggleSoldOut,
}: Props) {
  const viewingAll = selectedCategoryId == null;

  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Search color="#EA4B14" size={16} />
          <TextInput
            value={search}
            onChangeText={onSearch}
            placeholder="Search dishes"
            placeholderTextColor={authTheme.textDim}
            style={styles.searchInput}
            autoCorrect={false}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => onSearch('')} hitSlop={8} accessibilityLabel="Clear search">
              <X color="#78716C" size={15} />
            </Pressable>
          ) : null}
        </View>
        <IconButton label="Import" onPress={onImport} disabled={importDisabled}>
          <FileUp color="#44403C" size={16} />
        </IconButton>
      </View>

      {categoriesLoading ? (
        <ActivityIndicator color={authTheme.brand} style={styles.loader} />
      ) : categories.length === 0 ? (
        <Text style={styles.hint}>Categories will appear here. Add a dish to get started.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          {soldOutCount > 0 ? (
            <Pressable
              onPress={onToggleSoldOut}
              style={[styles.chip, soldOutOnly && styles.soldOn]}
            >
              <Text style={[styles.chipText, soldOutOnly && styles.soldOnText]}>
                86 · {soldOutCount}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => onSelectCategory(null)}
            style={[styles.chip, viewingAll && styles.chipOn]}
          >
            <UtensilsCrossed color={viewingAll ? '#EA4B14' : '#78716C'} size={13} />
            <Text style={[styles.chipText, viewingAll && styles.chipTextOn]}>All</Text>
            <Text style={[styles.chipCount, viewingAll && styles.chipCountOn]}>{allCount}</Text>
          </Pressable>
          {categories.map((category) => {
            const active = category.id === selectedCategoryId;
            return (
              <Pressable
                key={category.id}
                onPress={() => onSelectCategory(category.id)}
                style={[styles.chip, active && styles.chipOn]}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]} numberOfLines={1}>
                  {category.name}
                </Text>
                <Text style={[styles.chipCount, active && styles.chipCountOn]}>
                  {itemCountByCategory.get(category.id) ?? 0}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  search: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: authTheme.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1EAE3',
  },
  disabled: { opacity: 0.4 },
  loader: { alignSelf: 'flex-start', marginVertical: 6 },
  hint: {
    color: authTheme.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingHorizontal: 12,
    height: 38,
    maxWidth: 220,
  },
  chipOn: {
    backgroundColor: '#FFF1E8',
    borderColor: '#F6E4D6',
  },
  chipText: {
    color: '#57534E',
    fontSize: 13,
    fontFamily: fonts.semiBold,
    maxWidth: 120,
  },
  chipTextOn: {
    color: '#1C1917',
    fontFamily: fonts.bold,
  },
  chipCount: {
    color: '#A8A29E',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  chipCountOn: {
    color: '#EA4B14',
  },
  soldOn: {
    backgroundColor: '#B91C1C',
    borderColor: '#B91C1C',
  },
  soldOnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
});
