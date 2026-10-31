import { ChevronDown } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { menuModalStyles as styles } from '@/components/menu/menu-modal-styles';
import { authTheme } from '@/constants/auth-theme';
import type { MenuCategory } from '@/lib/restaurant/types';

/** Menu section the dish sits under. Only editable while creating. */
export function ItemSectionDropdown({
  editable,
  categories,
  value,
  fallbackName,
  onChange,
}: {
  editable: boolean;
  categories: MenuCategory[];
  value: string;
  fallbackName?: string;
  onChange: (categoryId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!editable) setOpen(false);
  }, [editable]);

  const label =
    categories.find((category) => category.id === value)?.name ||
    fallbackName ||
    'Select category';

  return (
    <>
      <Text style={styles.fieldLabel}>Category{editable ? ' *' : ''}</Text>
      {editable ? (
        <View style={styles.dropdownWrap}>
          <Pressable style={styles.dropdownTrigger} onPress={() => setOpen((o) => !o)}>
            <Text
              style={[styles.dropdownValue, !value && styles.dropdownPlaceholder]}
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
            <View style={styles.dropdownList}>
              {categories.length === 0 ? (
                <Text style={styles.dropdownEmpty}>No categories yet. Create one first.</Text>
              ) : (
                categories.map((category) => {
                  const active = category.id === value;
                  return (
                    <Pressable
                      key={category.id}
                      style={[styles.dropdownOption, active && styles.dropdownOptionOn]}
                      onPress={() => {
                        onChange(category.id);
                        setOpen(false);
                      }}
                    >
                      <Text
                        style={[styles.dropdownOptionText, active && styles.dropdownOptionTextOn]}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.dropdownTrigger, styles.dropdownReadonly]}>
          <Text style={styles.dropdownValue} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </>
  );
}
