import { StyleSheet } from 'react-native';

import { authTheme, PARTNER_BOTTOM_NAV_INSET } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export const kitchenAccountStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: PARTNER_BOTTOM_NAV_INSET,
    gap: 14,
  },
  center: { paddingVertical: 48, alignItems: 'center' },
  empty: { paddingVertical: 32, alignItems: 'center', gap: 10 },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: authTheme.text,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  input: {
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: authTheme.text,
    backgroundColor: '#FFFFFF',
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 16,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.error,
    textAlign: 'center',
  },
  deleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
  },
  deleteIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.error,
  },
  otpOverlay: { flex: 1, justifyContent: 'flex-end' },
  otpBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  otpSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 10,
  },
  linkRow: { alignItems: 'center', paddingVertical: 6 },
});
