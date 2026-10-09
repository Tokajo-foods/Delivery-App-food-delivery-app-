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
    backgroundColor: '#F6F3F0',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },

  header: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingBottom: 2,
    gap: 14,
  },
  logoRow: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 156,
    height: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationBtn: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  dhLocInline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginLeft: '-2%',
  },
  locKicker: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#EA4B14',
  },
  locTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },
  greeting: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: authTheme.text,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3E7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  dhAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF1E8',
    borderWidth: 1,
    borderColor: '#F3E7DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dhAvatarText: {
    color: '#EA4B14',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  dhBellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EA4B14',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  earnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 14,
    overflow: 'hidden',
    shadowColor: '#EA4B14',
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  earnWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 26,
  },
  dhEarnCol: {
    flex: 1,
    zIndex: 1,
  },
  dhEarnLabel: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  dhEarnAmount: {
    color: '#FFFFFF',
    fontFamily: fonts.extraBold,
    fontSize: 34,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  earnHook: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: fonts.semiBold,
    fontSize: 12.5,
    lineHeight: 17,
  },
  scooterSlot: {
    width: 128,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 1,
  },
  scooterImg: {
    width: 168,
    height: 118,
  },
  bellBtn: {
    marginTop: 8,
  },

  /* ---------- Sections ---------- */
  section: {
    gap: 8,
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
    alignItems: 'stretch',
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    overflow: 'hidden',
  },
  stat: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 28,
    alignSelf: 'center',
    backgroundColor: '#C5CAD3',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    maxWidth: '100%',
  },
  statValue: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: '#EA4B14',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  sectionKicker: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
  },
  statLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: authTheme.textMuted,
    textAlign: 'center',
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
    padding: 6,
  },
  perfItem: {
    width: '46%',
    margin: '2%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 2,
    borderRadius: 14,
    backgroundColor: '#FFF8F4',
  },
  perfIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  perfValue: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: authTheme.text,
    letterSpacing: -0.4,
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
    borderRadius: 18,
    paddingVertical: 18,
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

  /* ---------- Services grid ---------- */
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    paddingTop: 14,
    paddingBottom: 4,
  },
  serviceSlot: {
    width: '25%',
    position: 'relative',
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  serviceDivider: {
    position: 'absolute',
    right: 0,
    top: 10,
    width: 1,
    height: 28,
    backgroundColor: '#D8DCE3',
  },
  moreCard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  moreIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
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
