import { Text, View } from 'react-native';

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
  const bonus = earnings?.showIncentive ? earnings.incentive : 0;

  return (
    <View style={styles.payoutBlock}>
      <Text style={styles.kicker}>
        {stacked ? `${stackCount ?? 2} orders together` : 'New order'}
      </Text>
      <Text style={styles.payout}>
        {earnings ? formatInr(earnings.netTotal) : 'Earnings on accept'}
      </Text>
      <Text style={styles.payoutSub}>
        {bonus > 0 ? `Includes ${formatInr(bonus)} extra` : 'You earn this trip'}
      </Text>
    </View>
  );
}
