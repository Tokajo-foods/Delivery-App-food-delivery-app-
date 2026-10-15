import { StyleSheet } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export const earningsStyles = StyleSheet.create({
  list: { paddingHorizontal: 16, paddingTop: 4 },
  header: { gap: 12 },
  card: {
    backgroundColor: authTheme.card,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: authTheme.text },
  cardSub: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted, marginTop: 2 },

  stats: { flexDirection: 'row' },
  stat: { flex: 1, gap: 2 },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: authTheme.cardBorder,
    paddingLeft: 12,
  },
  statLabel: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  statValue: { fontFamily: fonts.bold, fontSize: 18, color: authTheme.text },
  statMeta: { fontFamily: fonts.medium, fontSize: 11, color: authTheme.textDim },

  footRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: authTheme.cardBorder,
    paddingTop: 12,
  },
  footLabel: { fontFamily: fonts.medium, fontSize: 13, color: authTheme.textMuted },
  footValue: { fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.text },

  passbookHead: {
    backgroundColor: authTheme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: authTheme.cardBorder,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    marginTop: 4,
  },
  row: {
    backgroundColor: authTheme.card,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    paddingHorizontal: 16,
  },
  rowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: authTheme.cardBorder },
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.text },
  rowSub: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 2 },
  rowAmount: { fontFamily: fonts.bold, fontSize: 15, color: authTheme.text },
  rowType: { fontFamily: fonts.medium, fontSize: 11, color: authTheme.textDim },
  passbookFoot: {
    backgroundColor: authTheme.card,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderColor: authTheme.cardBorder,
    minHeight: 16,
  },

  state: { paddingVertical: 20, alignItems: 'center', gap: 8 },
  stateText: { fontFamily: fonts.medium, fontSize: 13, color: authTheme.textMuted, textAlign: 'center' },
  errorText: { fontFamily: fonts.medium, fontSize: 13, color: authTheme.error, textAlign: 'center' },
  retry: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
  },
  retryText: { fontFamily: fonts.semiBold, fontSize: 13, color: authTheme.brand },
});
