import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CodRemitSheet } from '@/components/delivery/shared/CodRemitSheet';
import { fonts } from '@/constants/typography';
import { formatCurrency } from '@/lib/delivery-partner/analytics-api';
import { useCodLimitStatus } from '@/lib/delivery-partner/finance-hooks';
import { useDeliveryPartnerMe } from '@/lib/delivery-partner/hooks';
import { getApiErrorCode } from '@/lib/errors';

/** Live COD cap from GET /partners/me/cod/limit-status */
export function CodLimitBanner() {
  const [showRemit, setShowRemit] = useState(false);
  const me = useDeliveryPartnerMe(true);
  const ready = Boolean(me.data?.id) && !me.isError;
  const query = useCodLimitStatus(ready);
  const data = query.data;

  if (!ready) return null;

  if (query.isError && !data) {
    const code = getApiErrorCode(query.error);
    const msg = String(
      (query.error as { message?: string } | null)?.message ?? ''
    ).toLowerCase();
    if (
      code === 'FORBIDDEN' ||
      code === 'PARTNER_NOT_FOUND' ||
      code === 'UNAUTHORIZED' ||
      msg.includes('permission') ||
      msg.includes('forbidden')
    ) {
      return null;
    }
    return (
      <View style={[styles.bar, styles.barWarn]}>
        <Text style={styles.text}>Could not load COD limit.</Text>
        <Pressable onPress={() => void query.refetch()} hitSlop={8} style={styles.cta}>
          <Text style={styles.ctaText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  if (!data) return null;
  if (!data.blocked && !data.remitDueToday && data.usedPercent < 50) {
    return null;
  }

  const blocked = data.blocked || data.blocksNewCodOrders;
  const copy =
    data.message?.trim() ||
    (blocked
      ? `COD limit reached (${formatCurrency(data.cashInHand)} / ${formatCurrency(data.limit)}). Remit cash to accept new COD orders.`
      : `Cash in hand ${formatCurrency(data.cashInHand)} — remit today so you stay under ${formatCurrency(data.limit)}.`);

  return (
    <View style={[styles.bar, blocked ? styles.barBlocked : styles.barWarn]}>
      <Text style={styles.text}>{copy}</Text>
      <Pressable onPress={() => setShowRemit(true)} hitSlop={8} style={styles.cta}>
        <Text style={styles.ctaText}>Remit</Text>
      </Pressable>
      <CodRemitSheet visible={showRemit} onClose={() => setShowRemit(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barWarn: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  barBlocked: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  text: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: '#7C2D12',
  },
  cta: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#C2410C',
  },
});
