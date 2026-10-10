import { StyleSheet } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export const incomingOfferStyles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF7F2',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 12,
    maxHeight: '78%',
  },
  cardScroll: {
    flexGrow: 0,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  timerTrack: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#F3E8DE',
    overflow: 'hidden',
  },
  timerFill: {
    height: 4,
    borderRadius: 99,
    backgroundColor: authTheme.brand,
  },
  timerText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: authTheme.brand,
    minWidth: 36,
    textAlign: 'right',
  },
  timerUrgent: {
    color: '#B91C1C',
  },
  payoutBlock: {
    marginBottom: 14,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.textMuted,
  },
  payout: {
    marginTop: 2,
    fontFamily: fonts.extraBold,
    fontSize: 36,
    color: authTheme.text,
    letterSpacing: -0.8,
  },
  payoutSub: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.brand,
  },
  routeBlock: {
    borderRadius: 16,
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 4,
  },
  stop: {
    paddingVertical: 12,
  },
  stopDivider: {
    height: 1,
    backgroundColor: '#F3E8DE',
  },
  stopLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
  },
  stopTitle: {
    marginTop: 2,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: authTheme.text,
  },
  stopMeta: {
    marginTop: 4,
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
  stopMetaMuted: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  declineBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFF1E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#C2410C',
  },
  acceptBtn: {
    flex: 1.4,
    height: 52,
    borderRadius: 12,
    backgroundColor: authTheme.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
});
