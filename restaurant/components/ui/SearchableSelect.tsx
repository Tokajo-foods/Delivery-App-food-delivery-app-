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
 * Production searchable single-select (state / city pickers).
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
  emptyText = 'No matches',
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
    <View>
      {required ? (
        <RequiredLabel>{label}</RequiredLabel>
      ) : (
        <Text className="mb-1.5 text-sm font-semibold text-secondary">{label}</Text>
      )}
      <Pressable
        onPress={openPicker}
        disabled={disabled}
        className={`h-[52px] flex-row items-center justify-between rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 ${
          disabled ? 'opacity-50' : ''
        }`}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
      >
        <Text
          className={`flex-1 text-[15px] ${
            value ? 'font-semibold text-secondary' : 'text-secondary-light'
          }`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown color={theme.muted} size={18} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View
          className="flex-1 bg-white"
          style={{ paddingTop: Math.max(insets.top, 12) }}
        >
          <View className="flex-row items-center justify-between border-b border-gray-100 px-4 pb-3">
            <Text className="text-lg font-extrabold text-secondary">{label}</Text>
            <Pressable
              onPress={() => setOpen(false)}
              className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X color={theme.secondary} size={18} />
            </Pressable>
          </View>

          <View className="mx-4 mt-3 h-[48px] flex-row items-center gap-2 rounded-2xl border border-gray-200 bg-[#F8FAFC] px-3">
            <Search color={theme.muted} size={18} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.muted}
              autoFocus
              autoCorrect={false}
              className="flex-1 text-[15px] text-secondary"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <X color={theme.muted} size={16} />
              </Pressable>
            ) : null}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 24) + 16,
              paddingTop: 8,
            }}
            ListEmptyComponent={
              <Text className="mt-8 text-center text-sm text-secondary-light">
                {emptyText}
              </Text>
            }
            renderItem={({ item }) => {
              const active = item === value;
              return (
                <Pressable
                  onPress={() => pick(item)}
                  className={`mb-1.5 flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-100 bg-white'
                  }`}
                >
                  <Text
                    className={`flex-1 text-[15px] ${
                      active
                        ? 'font-bold text-primary'
                        : 'font-semibold text-secondary'
                    }`}
                  >
                    {item}
                  </Text>
                  {active ? <Check color={theme.primary} size={18} /> : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
