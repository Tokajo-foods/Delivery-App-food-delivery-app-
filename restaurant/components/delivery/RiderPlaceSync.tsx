import { TripLocationLock } from '@/components/delivery/TripLocationLock';
import { normalizeDeliveryStatus } from '@/lib/delivery-partner/api';
import { usePartnerDutyStatus } from '@/lib/delivery-partner/availability-hooks';
import { isDutySwitchOn } from '@/lib/delivery-partner/availability-types';
import { isBackgroundTripStatus } from '@/lib/delivery-partner/background-location-policy';
import { useActiveDelivery, useDeliveryPartnerMe } from '@/lib/delivery-partner/hooks';
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
  const active = useActiveDelivery(ready);
  const status = active.data?.status ? normalizeDeliveryStatus(active.data.status) : null;
  const onTrip = ready && isBackgroundTripStatus(status);
  useAutoLivePlace(ready, isOnline, onTrip);
  return <TripLocationLock onTrip={onTrip} />;
}
