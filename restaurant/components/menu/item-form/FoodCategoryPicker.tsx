import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { foodCategoryPickerStyles as styles } from '@/components/menu/item-form/food-category-picker-styles';
import type { FoodTypeValue } from '@/components/menu/item-form/item-form-types';
import { menuModalStyles } from '@/components/menu/menu-modal-styles';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import { useFoodCategories } from '@/lib/restaurant/food-categories-hooks';

const MAX_CHIPS = 18;

/** Platform food type (Pizza, Biryani…) the dish is listed under for customers. */
export function FoodCategoryPicker({
  value,
  onChange,
  required,
}: {
  value: FoodTypeValue;
  onChange: (value: FoodTypeValue) => void;
  required: boolean;
}) {
  const query = useFoodCategories();
  const [search, setSearch] = useState('');
  const list = query.data ?? [];

  const chips = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = (q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list).slice(
      0,
      MAX_CHIPS
    );
    const selected = list.find((c) => c.id === value.id);
    return selected && !rows.includes(selected) ? [selected, ...rows] : rows;
  }, [list, search, value.id]);

  const savedTypeMissing =
    Boolean(value.id) && !value.other && query.isSuccess && !list.some((c) => c.id === value.id);

  return (
    <View style={styles.wrap}>
      <Text style={menuModalStyles.fieldLabel}>Food type{required ? ' *' : ''}</Text>
      <Text style={styles.hint}>Customers find this dish under this type on the home screen.</Text>

      {list.length > MAX_CHIPS ? (
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search food types"
          placeholderTextColor={authTheme.textDim}
          style={styles.search}
        />
      ) : null}

      {query.isLoading ? (
        <ActivityIndicator color={authTheme.brand} style={{ marginBottom: 8 }} />
      ) : null}
      {query.isError ? (
        <Pressable onPress={() => void query.refetch()}>
          <Text style={styles.error}>
            {getApiErrorMessage(query.error, 'Could not load food types')}
          </Text>
          <Text style={styles.retry}>Tap to retry, or choose Other below.</Text>
        </Pressable>
      ) : null}
      {savedTypeMissing ? (
        <Text style={styles.status}>The saved food type is no longer offered. Pick another.</Text>
      ) : null}
      {query.isSuccess && search.trim() && chips.length === 0 ? (
        <Text style={styles.status}>No match. Choose Other and type it.</Text>
      ) : null}

      <View style={styles.chips}>
        {chips.map((category) => {
          const active = !value.other && value.id === category.id;
          return (
            <Pressable
              key={category.id}
              style={[styles.chip, active && styles.chipOn]}
              onPress={() => onChange({ id: category.id, other: false, otherName: '' })}
            >
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{category.name}</Text>
            </Pressable>
          );
        })}
        <Pressable
          style={[styles.chip, value.other && styles.chipOn]}
          onPress={() =>
            onChange({ ...value, other: true, otherName: value.otherName || search.trim() })
          }
        >
          <Text style={[styles.chipText, value.other && styles.chipTextOn]}>Other</Text>
        </Pressable>
      </View>

      {value.other ? (
        <TextInput
          value={value.otherName}
          onChangeText={(otherName) => onChange({ ...value, otherName })}
          placeholder="e.g. Momos"
          placeholderTextColor={authTheme.textDim}
          maxLength={120}
          autoFocus
          style={[menuModalStyles.input, styles.otherInput]}
        />
      ) : null}
    </View>
  );
}
