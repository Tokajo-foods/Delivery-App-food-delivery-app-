import {
  Landmark,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/dashboard/format';
import type { PassbookEntry, PassbookEntryKind } from '@/lib/restaurant/earnings-types';

import { entryTitle, formatIstTime, KIND_LABELS } from './earnings-format';

const KIND_STYLE: Record<PassbookEntryKind, { icon: LucideIcon; fg: string; bg: string }> = {
  order: { icon: ShoppingBag, fg: '#15803D', bg: '#F0FDF4' },
  rto_credit: { icon: RotateCcw, fg: '#B45309', bg: '#FFFBEB' },
  payout: { icon: Landmark, fg: '#1D4ED8', bg: '#EFF6FF' },
  adjustment: { icon: SlidersHorizontal, fg: '#64748B', bg: '#F8FAFC' },
};

function feeLine(entry: PassbookEntry): string | null {
  if (entry.grossAmount == null) return null;
  const pct = entry.commissionRate != null ? ` · ${+(entry.commissionRate * 100).toFixed(2)}%` : '';
  return `${formatCurrency(entry.grossAmount)} − fee ${formatCurrency(entry.commissionAmount ?? 0)}${pct}`;
}

export const PassbookRow = memo(function PassbookRow({
  entry,
  onOpenOrder,
}: {
  entry: PassbookEntry;
  onOpenOrder: (orderId: string) => void;
}) {
  const kind = KIND_STYLE[entry.kind];
  const Icon = kind.icon;
  const credit = entry.amount >= 0;
  const tappable = Boolean(entry.orderId);
  const fees = feeLine(entry);

  return (
    <Pressable
      disabled={!tappable}
      onPress={() => entry.orderId && onOpenOrder(entry.orderId)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole={tappable ? 'button' : undefined}
      accessibilityLabel={`${entryTitle(entry)}, ${credit ? 'credited' : 'debited'} ${formatCurrency(Math.abs(entry.amount))}`}
    >
      <View style={[styles.icon, { backgroundColor: kind.bg }]}>
        <Icon color={kind.fg} size={16} strokeWidth={2.1} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {entryTitle(entry)}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatIstTime(entry.createdAt)} · {KIND_LABELS[entry.kind]}
          {fees ? ` · ${fees}` : ''}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: credit ? '#15803D' : '#B91C1C' }]}>
          {credit ? '+' : '−'}
          {formatCurrency(Math.abs(entry.amount))}
        </Text>
        <Text style={styles.balance}>Bal {formatCurrency(entry.balanceAfter)}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F1EAE3',
  },
  pressed: { backgroundColor: '#FAFAF9' },
  icon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontFamily: fonts.semiBold, fontSize: 14, color: authTheme.text },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontFamily: fonts.bold, fontSize: 14 },
  balance: { fontFamily: fonts.medium, fontSize: 11, color: authTheme.textDim },
});
