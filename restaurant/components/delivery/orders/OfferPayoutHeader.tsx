import { Text, View } from 'react-native';

import { RiderPayoutLines } from '@/components/delivery/orders/RiderPayoutLines';
import { incomingOfferStyles as styles } from '@/components/delivery/orders/incoming-offer-styles';
import {
  formatInr,
  resolveOfferEarnings,
  type OfferEarnings,
} from '@/lib/delivery-partner/offer-earnings';
import type { IncomingOffer } from '@/lib/delivery-partner/offer-store';

type Props = {
  offer: IncomingOffer;
  stacked?: boolean;
  stackCount?: number;
  stackEarnings?: OfferEarnings | null;
};

export function OfferPayoutHeader({
  offer,
  stacked,
  stackCount,
  stackEarnings,
}: Props) {
  const earnings = stackEarnings ?? resolveOfferEarnings(offer);
  const fee = offer.deliveryFee;
  const incentive = earnings?.showIncentive ? earnings.incentive : 0;
  const tip = earnings?.tip ?? 0;
  const commission = offer.platformCommissionPct;
  const parts = [
    fee != null ? `${formatInr(fee)} delivery` : null,
    incentive > 0 ? `${formatInr(incentive)} incentive` : null,
    commission != null ? `after ${commission}% platform` : null,
    tip > 0 ? `${formatInr(tip)} tip` : null,
  ].filter(Boolean);

  return (
    <View style={styles.payoutBlock}>
      <Text style={styles.kicker}>
        {stacked ? `${stackCount ?? 2} orders together` : 'New order'}
      </Text>
      <Text style={styles.payout}>
        {earnings ? formatInr(earnings.netTotal) : 'Earnings on accept'}
      </Text>
      {offer.payout ? (
        <RiderPayoutLines
          payout={offer.payout}
          rowStyle={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}
          labelStyle={styles.payoutSub}
          valueStyle={styles.payoutSub}
          strongStyle={{ color: '#111827', fontWeight: '700' }}
        />
      ) : (
        <Text style={styles.payoutSub}>
          {parts.length ? parts.join(' · ') : 'You earn this trip'}
        </Text>
      )}
    </View>
  );
}
