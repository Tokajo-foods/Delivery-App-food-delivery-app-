import { StyleSheet } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export const foodCategoryPickerStyles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  hint: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 8,
    lineHeight: 16,
  },
  search: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: authTheme.text,
    fontSize: 14,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: { backgroundColor: authTheme.brandSoft, borderColor: authTheme.brand },
  chipText: { color: authTheme.textMuted, fontSize: 12, fontFamily: fonts.semiBold },
  chipTextOn: { color: authTheme.brand },
  status: {
    color: authTheme.textMuted,
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  error: { color: '#B91C1C', fontSize: 12, fontFamily: fonts.medium, marginBottom: 6 },
  retry: { color: authTheme.brand, fontSize: 12, fontFamily: fonts.bold, marginBottom: 8 },
  otherInput: { marginTop: 8, marginBottom: 0 },
});
