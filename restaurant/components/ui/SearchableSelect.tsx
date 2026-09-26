import { Check, ChevronDown, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

const H_PAD = 20;
const ROW_H = 56;

/**
 * Swiggy-style searchable picker — padded list rows, safe area, reliable on Android.
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
  const listRef = useRef<FlatList<string>>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open || !value) return;
    const index = filtered.findIndex((item) => item === value);
    if (index < 0) return;
    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index,
          animated: false,
          viewPosition: 0.35,
        });
      } catch {
        // ignore if list not measured yet
      }
    }, 80);
    return () => clearTimeout(t);
  }, [open, value, filtered]);

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

  const topInset =
    Platform.OS === 'android'
      ? Math.max(insets.top, StatusBar.currentHeight ?? 0, 12)
      : Math.max(insets.top, 12);
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <View>
      {required ? (
        <RequiredLabel>{label}</RequiredLabel>
      ) : (
        <Text style={styles.fieldLabel}>{label}</Text>
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
        presentationStyle="fullScreen"
        statusBarTranslucent={Platform.OS === 'android'}
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.sheet, { paddingTop: topInset }]}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle}>{label}</Text>
                <Text style={styles.headerMeta}>
                  {filtered.length === options.length
                    ? `${options.length} available`
                    : `${filtered.length} of ${options.length} matches`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                activeOpacity={0.7}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X color={theme.secondary} size={20} />
              </TouchableOpacity>
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
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={12}>
                  <X color={theme.muted} size={16} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <FlatList
            ref={listRef}
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: ROW_H,
              offset: ROW_H * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0.35,
                });
              }, 100);
            }}
            contentContainerStyle={{
              paddingBottom: bottomInset + 24,
              paddingTop: 4,
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No results</Text>
                <Text style={styles.emptySub}>{emptyText}</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const active = item === value;
              const isLast = index === filtered.length - 1;
              return (
                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={() => pick(item)}
                  style={[
                    styles.row,
                    active && styles.rowActive,
                    isLast && styles.rowLast,
                  ]}
                >
                  <Text
                    style={[styles.rowText, active && styles.rowTextActive]}
                    numberOfLines={1}
                  >
                    {item}
                  </Text>
                  {active ? (
                    <View style={styles.checkOn}>
                      <Check color="#FFFFFF" size={14} strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={styles.checkOff} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: theme.secondary,
  },
  trigger: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  triggerFilled: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  triggerDisabled: {
    opacity: 0.55,
    backgroundColor: '#F8FAFC',
  },
  triggerText: {
    flex: 1,
    paddingRight: 10,
    fontSize: 15,
    fontWeight: '600',
    color: theme.secondary,
  },
  triggerPlaceholder: {
    fontWeight: '500',
    color: theme.muted,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.secondary,
    letterSpacing: -0.4,
  },
  headerMeta: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
    color: theme.secondaryLight,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  searchBox: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: theme.secondary,
    paddingVertical: 0,
  },
  row: {
    height: ROW_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: H_PAD,
    paddingRight: H_PAD,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF2F7',
  },
  rowActive: {
    backgroundColor: '#FFF7ED',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    paddingRight: 14,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: theme.secondary,
  },
  rowTextActive: {
    fontWeight: '700',
    color: theme.primary,
  },
  checkOn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
  },
  checkOff: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  emptyWrap: {
    paddingTop: 72,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: theme.secondary,
  },
  emptySub: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: theme.secondaryLight,
    lineHeight: 18,
  },
});
