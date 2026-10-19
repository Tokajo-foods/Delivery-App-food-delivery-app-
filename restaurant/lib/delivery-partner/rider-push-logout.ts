import { deliveryPartnerApi } from '@/lib/delivery-partner/api';
import { clearStoredRiderOfferDevice, loadStoredRiderOfferDevice } from '@/lib/user/push-token';

const TIMEOUT_MS = 4000;

/**
 * Call while the session is still valid, so a signed-out phone stops receiving
 * delivery offers. Never blocks logout for more than a few seconds.
 */
export async function unregisterRiderPush(): Promise<void> {
  const offerId = await loadStoredRiderOfferDevice().catch(() => null);
  if (offerId) {
    await Promise.race([
      deliveryPartnerApi.unregisterOfferDevice(offerId).catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, TIMEOUT_MS)),
    ]);
  }
  await clearStoredRiderOfferDevice().catch(() => undefined);
}
