import { DeliveryScreenShell } from '@/components/delivery/shared/ScreenShell';
import { PartnerEarningsManager } from '@/components/delivery/earnings/EarningsManager';

/** /delivery/earnings */
export default function DeliveryEarningsRoute() {
  return (
    <DeliveryScreenShell title="Earnings" subtitle="Earnings, COD and passbook" flush>
      <PartnerEarningsManager />
    </DeliveryScreenShell>
  );
}
