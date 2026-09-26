import { StyleSheet } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export const contactChangeStyles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: authTheme.text,
  },
  sheetHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: authTheme.textMuted,
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: '#DC2626',
  },
  input: {
    marginTop: 14,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: authTheme.text,
    backgroundColor: '#F8FAFC',
  },
  primaryBtn: {
    marginTop: 16,
    height: 52,
    borderRadius: 14,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  linkBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 6 },
  linkText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: authTheme.brand,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: authTheme.textMuted,
  },
  successWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successCheck: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: '#16A34A',
  },
  successBody: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
    color: authTheme.textMuted,
  },
  successValue: {
    marginTop: 12,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: authTheme.text,
  },
});
