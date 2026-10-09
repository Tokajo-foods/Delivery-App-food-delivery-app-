import { usePartnerDutyStatus } from '@/lib/delivery-partner/availability-hooks';
import { isDutySwitchOn } from '@/lib/delivery-partner/availability-types';
import { useDeliveryPartnerMe } from '@/lib/delivery-partner/hooks';
import { useAutoLivePlace } from '@/lib/delivery-partner/use-auto-live-place';

/** Keeps the header place and duty in sync with device location for the whole rider app. */
export function RiderPlaceSync({ enabled }: { enabled: boolean }) {
  const me = useDeliveryPartnerMe(enabled);
  const duty = usePartnerDutyStatus(enabled);
  const dutyStatus = duty.data?.dutyStatus ?? me.data?.dutyStatus;
  const isOnline = isDutySwitchOn(
    dutyStatus,
    Boolean(me.data?.isOnline ?? me.data?.isAvailable ?? duty.data?.isOnline)
  );
  const ready = enabled && !me.isLoading && Boolean(me.data?.id);
  useAutoLivePlace(ready, isOnline);
  return null;
}
