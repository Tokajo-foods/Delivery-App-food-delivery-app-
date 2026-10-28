import { StyleSheet } from 'react-native';

import { fonts } from '@/constants/typography';

export const doorstepPayStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#EA4B14',
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: '#111827',
    marginTop: 2,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    color: '#111827',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
  },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#B45309',
  },
  center: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  qrCard: {
    alignSelf: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFF7F2',
  },
  qr: {
    width: 220,
    height: 220,
    backgroundColor: '#FFFFFF',
  },
  primary: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondary: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3D2C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#9A3412',
  },
});
