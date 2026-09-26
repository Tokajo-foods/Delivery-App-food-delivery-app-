import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RequiredLabel } from '@/components/restaurant/SetupProgress';
import { searchableSelectStyles as styles } from '@/components/ui/searchable-select-styles';
import { theme } from '@/constants/theme';

type Props = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
};

/**
 * Production searchable picker — clean list rows (no pill borders).
 */
export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  required,
  disabled,
  searchPlaceholder = 'Search…',
  emptyText = 'Try a different spelling',
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.toLowerCase().includes(q));
  }, [options, query]);

  const openPicker = () => {
    if (disabled) return;
    setQuery('');
    setOpen(true);
  };

  const pick = (item: string) => {
    onChange(item);
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={styles.fieldWrap}>
      {required ? (
        <RequiredLabel>{label}</RequiredLabel>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}

      <Pressable
        onPress={openPicker}
        disabled={disabled}
        style={[
          styles.trigger,
          value ? styles.triggerFilled : null,
          disabled ? styles.triggerDisabled : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
      >
        <Text
          style={[styles.triggerText, !value && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <View style={styles.chevron}>
          <ChevronDown color={theme.secondaryLight} size={16} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.sheet, { paddingTop: Math.max(insets.top, 6) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.headerTitle}>{label}</Text>
                <Text style={styles.headerMeta}>
                  {filtered.length === options.length
                    ? `${options.length} available`
                    : `${filtered.length} of ${options.length} matches`}
                </Text>
              </View>
              <Pressable
                onPress={() => setOpen(false)}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X color={theme.secondary} size={18} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Search color={theme.muted} size={18} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.muted}
                autoFocus
                autoCorrect={false}
                style={styles.searchInput}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={10}>
                  <X color={theme.muted} size={16} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <FlatList
            style={styles.list}
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 20) + 12,
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No results</Text>
                <Text style={styles.emptySub}>{emptyText}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const active = item === value;
              return (
                <Pressable
                  onPress={() => pick(item)}
                  style={({ pressed }) => [
                    styles.row,
                    active && styles.rowActive,
                    pressed && !active && styles.rowPressed,
                  ]}
                >
                  <Text
                    style={[styles.rowText, active && styles.rowTextActive]}
                    numberOfLines={2}
                  >
                    {item}
                  </Text>
                  {active ? (
                    <View style={styles.check}>
                      <Check color="#FFFFFF" size={13} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
