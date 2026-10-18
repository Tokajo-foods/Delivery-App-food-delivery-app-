import { StyleSheet } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export const hoursDriftStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: authTheme.text,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  body: {
    color: authTheme.textMuted,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  day: {
    color: authTheme.text,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  slotRow: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 6 },
  label: {
    color: authTheme.textMuted,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: authTheme.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: authTheme.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  error: {
    color: authTheme.error,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  later: { alignItems: 'center', paddingVertical: 6 },
  laterText: {
    color: authTheme.textMuted,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
