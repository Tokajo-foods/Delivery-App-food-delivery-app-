import {
  ChevronRight,
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
  order: { icon: ShoppingBag, fg: '#15803D', bg: '#DCFCE7' },
  rto_credit: { icon: RotateCcw, fg: '#B45309', bg: '#FEF3C7' },
  payout: { icon: Landmark, fg: '#1D4ED8', bg: '#DBEAFE' },
  adjustment: { icon: SlidersHorizontal, fg: '#475569', bg: '#F1F5F9' },
};

function feeLine(entry: PassbookEntry): string | null {
  if (entry.grossAmount == null) return null;
  const pct = entry.commissionRate != null ? ` (${+(entry.commissionRate * 100).toFixed(2)}%)` : '';
  return `Food ${formatCurrency(entry.grossAmount)} · Fee −${formatCurrency(entry.commissionAmount ?? 0)}${pct}`;
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
        <Icon color={kind.fg} size={17} strokeWidth={2.2} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{entryTitle(entry)}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.time}>{formatIstTime(entry.createdAt)}</Text>
          <View style={[styles.badge, { backgroundColor: kind.bg }]}>
            <Text style={[styles.badgeText, { color: kind.fg }]}>{KIND_LABELS[entry.kind]}</Text>
          </View>
        </View>
        {fees ? <Text style={styles.fees} numberOfLines={1}>{fees}</Text> : null}
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: credit ? '#15803D' : '#B91C1C' }]}>
          {credit ? '+' : '−'}{formatCurrency(Math.abs(entry.amount))}
        </Text>
        <Text style={styles.balance}>Bal {formatCurrency(entry.balanceAfter)}</Text>
      </View>
      {tappable ? <ChevronRight color={authTheme.textDim} size={16} /> : <View style={styles.chevronGap} />}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  pressed: { backgroundColor: '#F8FAFC' },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.bold, fontSize: 14, color: authTheme.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: { fontFamily: fonts.medium, fontSize: 12, color: authTheme.textMuted },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontFamily: fonts.semiBold, fontSize: 10.5 },
  fees: { fontFamily: fonts.medium, fontSize: 11.5, color: authTheme.textDim },
  right: { alignItems: 'flex-end', gap: 3 },
  amount: { fontFamily: fonts.bold, fontSize: 14.5 },
  balance: { fontFamily: fonts.medium, fontSize: 11, color: authTheme.textDim },
  chevronGap: { width: 16 },
});
