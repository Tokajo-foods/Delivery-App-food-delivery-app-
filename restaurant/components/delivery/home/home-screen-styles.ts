import { StyleSheet } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

/**
 * Delivery Home styling — clean, Swiggy/Zomato-style surface:
 * white canvas, soft warm borders, gentle shadows, consistent radii.
 */
const CARD_BORDER = '#F1EAE3';
const SOFT_SHADOW = {
  shadowColor: '#1F1300',
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
} as const;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    gap: 20,
  },

  /* ---------- Orange header (duty control lives here) ---------- */
  darkHeader: {
    marginHorizontal: -16,
    marginTop: -40,
    marginBottom: 4,
    backgroundColor: '#EA4B14',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  dhTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  dhLocation: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  dhHello: {
    color: '#FFFFFF',
    fontFamily: fonts.extraBold,
    fontSize: 23,
    letterSpacing: -0.5,
  },
  dhLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  dhLocText: {
    flexShrink: 1,
    minWidth: 0,
    color: 'rgba(255,255,255,0.95)',
    fontFamily: fonts.medium,
    fontSize: 12.5,
  },
  dhActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dhAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  dhAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhAvatarText: {
    color: '#EA4B14',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  dhBell: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhBellDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EA4B14',
  },
  dhEarnPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  dhEarnCol: {
    flex: 1,
  },
  dhEarnLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: fonts.medium,
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
  dhEarnAmount: {
    color: '#FFFFFF',
    fontFamily: fonts.extraBold,
    fontSize: 32,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  scooterImg: {
    width: 120,
    height: 88,
  },

  /* ---------- Sections ---------- */
  section: {
    gap: 10,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: authTheme.text,
    letterSpacing: -0.3,
  },

  /* ---------- Active trip ---------- */
  activeCard: {
    backgroundColor: '#EA4B14',
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#EA4B14',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  activeSummary: {
    gap: 0,
  },
  tripActionsCard: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SOFT_SHADOW,
  },
  activeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeCardLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  activeCardValue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  activeBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  activeBadgeText: {
    color: '#EA4B14',
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 3,
    marginVertical: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  activeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* ---------- Demand / retry CTA ---------- */
  demandCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF7F2',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FBE2D2',
  },
  demandCtaTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: authTheme.text,
  },
  demandCtaHint: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: authTheme.textMuted,
  },

  /* ---------- Quick stats ---------- */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SOFT_SHADOW,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: authTheme.textMuted,
  },

  /* ---------- Performance card ---------- */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
    ...SOFT_SHADOW,
  },
  perfGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  perfItem: {
    width: '50%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: CARD_BORDER,
  },
  perfValue: {
    fontFamily: fonts.extraBold,
    fontSize: 19,
    color: authTheme.text,
    letterSpacing: -0.3,
  },
  perfLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
  },

  /* ---------- History ---------- */
  recentList: {
    gap: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SOFT_SHADOW,
  },
  listLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: authTheme.textDim,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  listTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14.5,
    color: authTheme.text,
  },
  orderStatusPill: {
    backgroundColor: '#FFF1E8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  orderStatusText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#EA4B14',
  },
  emptyHistory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SOFT_SHADOW,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: authTheme.textMuted,
    textAlign: 'center',
  },

  /* ---------- Services rail ---------- */
  moreScroll: {
    gap: 12,
    paddingVertical: 2,
    paddingRight: 4,
  },
  moreCard: {
    width: 96,
    paddingHorizontal: 10,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    ...SOFT_SHADOW,
  },
  moreIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E8',
  },
  moreLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.text,
    textAlign: 'center',
  },

  /* ---------- Misc ---------- */
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: authTheme.brand,
  },
});
