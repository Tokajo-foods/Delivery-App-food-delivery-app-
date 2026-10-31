import { ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { foodCategoryPickerStyles as styles } from '@/components/menu/item-form/food-category-picker-styles';
import type { FoodTypeValue } from '@/components/menu/item-form/item-form-types';
import { menuModalStyles } from '@/components/menu/menu-modal-styles';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';
import { useFoodCategories } from '@/lib/restaurant/food-categories-hooks';

/** Home-page food categories plus Other (typed name creates the category via API). */
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const list = query.data ?? [];

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
    return rows;
  }, [list, search]);

  const selected = list.find((c) => c.id === value.id);
  const label = value.other
    ? value.otherName.trim()
      ? `Other · ${value.otherName.trim()}`
      : 'Other'
    : selected?.name || 'Select category';

  return (
    <View style={styles.wrap}>
      <Text style={menuModalStyles.fieldLabel}>Category{required ? ' *' : ''}</Text>
      <Text style={styles.hint}>
        Same categories as the customer home screen. Choose Other if yours is missing.
      </Text>

      {query.isLoading ? (
        <ActivityIndicator color={authTheme.brand} style={{ marginBottom: 8 }} />
      ) : null}
      {query.isError ? (
        <Pressable onPress={() => void query.refetch()}>
          <Text style={styles.error}>
            {getApiErrorMessage(query.error, 'Could not load categories')}
          </Text>
          <Text style={styles.retry}>Tap to retry, or choose Other below.</Text>
        </Pressable>
      ) : null}

      <View style={menuModalStyles.dropdownWrap}>
        <Pressable
          style={menuModalStyles.dropdownTrigger}
          onPress={() => setOpen((wasOpen) => !wasOpen)}
        >
          <Text
            style={[
              menuModalStyles.dropdownValue,
              !value.other && !value.id && menuModalStyles.dropdownPlaceholder,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <ChevronDown
            color={authTheme.textMuted}
            size={18}
            style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
          />
        </Pressable>
        {open ? (
          <View style={menuModalStyles.dropdownList}>
            {list.length > 12 ? (
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search categories"
                placeholderTextColor={authTheme.textDim}
                style={styles.search}
              />
            ) : null}
            <ScrollView nestedScrollEnabled style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
              {query.isSuccess && options.length === 0 ? (
                <Text style={menuModalStyles.dropdownEmpty}>No match. Choose Other and type it.</Text>
              ) : (
                options.map((category) => {
                  const active = !value.other && value.id === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        menuModalStyles.dropdownOption,
                        active && menuModalStyles.dropdownOptionOn,
                      ]}
                      onPress={() => {
                        onChange({ id: category.id, other: false, otherName: '' });
                        setOpen(false);
                        setSearch('');
                      }}
                    >
                      <Text
                        style={[
                          menuModalStyles.dropdownOptionText,
                          active && menuModalStyles.dropdownOptionTextOn,
                        ]}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
              <Pressable
                style={[
                  menuModalStyles.dropdownOption,
                  value.other && menuModalStyles.dropdownOptionOn,
                ]}
                onPress={() => {
                  onChange({
                    ...value,
                    other: true,
                    otherName: value.otherName || search.trim(),
                  });
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    menuModalStyles.dropdownOptionText,
                    value.other && menuModalStyles.dropdownOptionTextOn,
                  ]}
                >
                  Other
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        ) : null}
      </View>

      {value.other ? (
        <TextInput
          value={value.otherName}
          onChangeText={(otherName) => onChange({ ...value, other: true, otherName })}
          placeholder="Type the category name, e.g. Momos"
          placeholderTextColor={authTheme.textDim}
          maxLength={120}
          autoFocus
          style={[menuModalStyles.input, styles.otherInput]}
        />
      ) : null}
    </View>
  );
}
