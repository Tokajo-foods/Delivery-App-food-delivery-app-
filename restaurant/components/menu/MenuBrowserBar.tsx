import {
  Clock3,
  FileUp,
  MoreVertical,
  Plus,
  Search,
  Store,
  UtensilsCrossed,
  X,
} from 'lucide-react-native';
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
import type { MenuCategory } from '@/lib/restaurant/types';

type Props = {
  search: string;
  onSearch: (value: string) => void;
  onOutlets: () => void;
  onImport: () => void;
  onAddCategory: () => void;
  importDisabled?: boolean;
  categoriesLoading?: boolean;
  categories: MenuCategory[];
  selectedCategoryId: string | null;
  allCount: number;
  itemCountByCategory: Map<string, number>;
  onSelectCategory: (categoryId: string | null) => void;
  onCategoryMenu: (categoryId: string) => void;
  soldOutCount: number;
  soldOutOnly: boolean;
  onToggleSoldOut: () => void;
};

function IconButton({
  label,
  onPress,
  disabled,
  primary,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.iconBtn, primary && styles.iconBtnPrimary, disabled && styles.disabled]}
    >
      {children}
    </Pressable>
  );
}

export function MenuBrowserBar({
  search,
  onSearch,
  onOutlets,
  onImport,
  onAddCategory,
  importDisabled,
  categoriesLoading,
  categories,
  selectedCategoryId,
  allCount,
  itemCountByCategory,
  onSelectCategory,
  onCategoryMenu,
  soldOutCount,
  soldOutOnly,
  onToggleSoldOut,
}: Props) {
  const viewingAll = selectedCategoryId == null;

  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Search color="#A8A29E" size={16} />
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
        <IconButton label="Outlets" onPress={onOutlets}>
          <Store color="#44403C" size={16} />
        </IconButton>
        <IconButton label="Import" onPress={onImport} disabled={importDisabled}>
          <FileUp color="#44403C" size={16} />
        </IconButton>
        <IconButton label="Add category" onPress={onAddCategory} primary>
          <Plus color="#FFFFFF" size={16} />
        </IconButton>
      </View>

      {categoriesLoading ? (
        <ActivityIndicator color={authTheme.brand} style={styles.loader} />
      ) : categories.length === 0 ? (
        <Text style={styles.hint}>Add a category, then add dishes.</Text>
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
            <UtensilsCrossed color={viewingAll ? '#FFFFFF' : '#78716C'} size={13} />
            <Text style={[styles.chipText, viewingAll && styles.chipTextOn]}>All</Text>
            <Text style={[styles.chipCount, viewingAll && styles.chipTextOn]}>{allCount}</Text>
          </Pressable>
          {categories.map((category) => {
            const active = category.id === selectedCategoryId;
            const hidden = category.isActive === false;
            const scheduled = Boolean(category.schedule?.periods?.length);
            return (
              <Pressable
                key={category.id}
                onPress={() => onSelectCategory(category.id)}
                onLongPress={() => onCategoryMenu(category.id)}
                style={[styles.chip, active && styles.chipOn, hidden && !active && styles.hidden]}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]} numberOfLines={1}>
                  {category.name}
                </Text>
                <Text style={[styles.chipCount, active && styles.chipTextOn]}>
                  {itemCountByCategory.get(category.id) ?? 0}
                </Text>
                {scheduled ? (
                  <Clock3 color={active ? '#FFFFFF' : '#78716C'} size={12} />
                ) : null}
                {hidden ? (
                  <Text style={[styles.chipCount, active && styles.chipTextOn]}>Off</Text>
                ) : null}
                <Pressable
                  hitSlop={8}
                  onPress={() => onCategoryMenu(category.id)}
                  accessibilityLabel={`${category.name} actions`}
                >
                  <MoreVertical color={active ? '#FFFFFF' : '#A8A29E'} size={14} />
                </Pressable>
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
    paddingBottom: 8,
    gap: 8,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: authTheme.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    paddingVertical: 0,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  iconBtnPrimary: {
    backgroundColor: authTheme.brand,
    borderColor: authTheme.brand,
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
    borderColor: '#E7E5E4',
    paddingHorizontal: 10,
    height: 34,
    maxWidth: 200,
  },
  chipOn: {
    backgroundColor: '#1C1917',
    borderColor: '#1C1917',
  },
  chipText: {
    color: '#57534E',
    fontSize: 13,
    fontFamily: fonts.semiBold,
    maxWidth: 110,
  },
  chipTextOn: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  chipCount: {
    color: '#A8A29E',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  soldOn: {
    backgroundColor: '#B91C1C',
    borderColor: '#B91C1C',
  },
  soldOnText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
  },
  hidden: { opacity: 0.55 },
});
