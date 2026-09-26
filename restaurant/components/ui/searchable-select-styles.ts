import { StyleSheet } from 'react-native';

import { theme } from '@/constants/theme';

export const searchableSelectStyles = StyleSheet.create({
  fieldWrap: {
    gap: 0,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    color: theme.secondary,
  },
  trigger: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  triggerFilled: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFBEB',
  },
  triggerDisabled: {
    opacity: 0.55,
    backgroundColor: '#F8FAFC',
  },
  triggerText: {
    flex: 1,
    paddingRight: 10,
    fontSize: 15,
    fontWeight: '600',
    color: theme.secondary,
  },
  triggerPlaceholder: {
    fontWeight: '500',
    color: theme.muted,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.secondary,
    letterSpacing: -0.3,
  },
  headerMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
    color: theme.secondaryLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  searchBox: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.secondary,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  rowActive: {
    backgroundColor: '#FFF7ED',
  },
  rowPressed: {
    backgroundColor: '#F8FAFC',
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
    fontSize: 16,
    fontWeight: '500',
    color: theme.secondary,
  },
  rowTextActive: {
    fontWeight: '700',
    color: theme.primary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginLeft: 20,
  },
  emptyWrap: {
    paddingTop: 64,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.secondary,
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: theme.secondaryLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
