import { api, assertApiBaseUrl } from '@/lib/api';
import { PartnerApiError } from '@/lib/errors';

export type TripFeedback = {
  deliveryId: string;
  orderId: string;
  restaurantStars: number | null;
  customerStars: number | null;
  ratedAt: string | null;
};

type Envelope = { data?: TripFeedback | null; message?: string; code?: string };

async function read(path: string, method: 'GET' | 'POST', body?: unknown): Promise<TripFeedback | null> {
  assertApiBaseUrl();
  try {
    const res = method === 'GET'
      ? await api.get<Envelope>(path)
      : await api.post<Envelope>(path, body);
    return res.data?.data ?? null;
  } catch (error) {
    const data = (error as { response?: { data?: { message?: string; code?: string } } }).response?.data;
    throw new PartnerApiError(data?.message || 'Could not save the rating.', data?.code);
  }
}

export const tripRatingApi = {
  pending() {
    return read('/api/v1/delivery-service/partners/me/feedback/pending', 'GET');
  },
  save(
    deliveryId: string,
    body: { restaurantStars: number; customerStars: number }
  ) {
    return read(
      `/api/v1/delivery-service/partners/me/deliveries/${encodeURIComponent(deliveryId)}/feedback`,
      'POST',
      body
    );
  },
};
