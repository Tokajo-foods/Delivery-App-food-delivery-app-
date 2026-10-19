import { StyleSheet } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';

export const kitchenInboxStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filters: { flexDirection: 'row', gap: 8 },
  actions: { flexDirection: 'row', gap: 6 },
  actionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: authTheme.surface,
  },
  actionText: { color: authTheme.brand, fontSize: 12, fontFamily: fonts.semiBold },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: authTheme.surface,
  },
  filterChipActive: { backgroundColor: authTheme.brand },
  filterText: { color: authTheme.textMuted, fontSize: 13, fontFamily: fonts.semiBold },
  filterTextActive: { color: '#FFFFFF' },
  content: { paddingHorizontal: 16, gap: 8 },
  center: { paddingVertical: 48, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 8, paddingHorizontal: 24 },
  emptyTitle: { color: authTheme.text, fontSize: 16, fontFamily: fonts.bold },
  muted: {
    color: authTheme.textMuted,
    fontSize: 13,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
  retry: {
    marginTop: 8,
    backgroundColor: authTheme.brand,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: { color: '#FFFFFF', fontSize: 13, fontFamily: fonts.bold },
  retryTextInline: { color: authTheme.brand, fontSize: 13, fontFamily: fonts.semiBold },
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: authTheme.surface,
    gap: 6,
  },
  cardTitle: { color: authTheme.text, fontSize: 15, fontFamily: fonts.bold },
  cardHint: { color: authTheme.textMuted, fontSize: 12, fontFamily: fonts.medium, lineHeight: 17 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  prefText: { flex: 1, paddingRight: 12 },
  prefLabel: { color: authTheme.text, fontSize: 14, fontFamily: fonts.semiBold },
  prefSub: { color: authTheme.textMuted, fontSize: 12, fontFamily: fonts.medium, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginVertical: 6 },
  deviceLine: { color: authTheme.text, fontSize: 13, fontFamily: fonts.medium },
});
