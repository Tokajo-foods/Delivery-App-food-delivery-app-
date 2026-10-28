import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { doorstepPayStyles as styles } from '@/components/delivery/orders/doorstep-pay-styles';
import { tripRatingApi } from '@/lib/delivery-partner/trip-rating-api';
import {
  dismissTripRating,
  offerTripRating,
  subscribeTripRating,
} from '@/lib/delivery-partner/trip-rating';

function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const on = star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
            hitSlop={6}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? '#EA4B14' : '#F3F4F6',
            }}
          >
            <Text style={{ color: on ? '#FFFFFF' : '#9CA3AF', fontSize: 18 }}>
              ★
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TripRatingHost() {
  const insets = useSafeAreaInsets();
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState(0);
  const [customer, setCustomer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeTripRating((row) => setDeliveryId(row?.deliveryId ?? null)), []);

  useEffect(() => {
    let stop = false;
    void tripRatingApi.pending().then((row) => {
      if (!stop && row && !row.ratedAt) offerTripRating(row.deliveryId);
    }).catch(() => undefined);
    return () => {
      stop = true;
    };
  }, []);

  const close = () => {
    if (deliveryId) dismissTripRating(deliveryId);
    setRestaurant(0);
    setCustomer(0);
    setError(null);
  };

  const save = async () => {
    if (!deliveryId || restaurant < 1 || customer < 1) {
      setError('Choose a rating for the restaurant and the customer.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await tripRatingApi.save(deliveryId, {
        restaurantStars: restaurant,
        customerStars: customer,
      });
      dismissTripRating(deliveryId);
      setRestaurant(0);
      setCustomer(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the rating.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={Boolean(deliveryId)} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <Text style={styles.kicker}>Delivery complete</Text>
          <Text style={styles.title}>How was this drop?</Text>
          <Text style={styles.body}>Restaurant</Text>
          <Stars value={restaurant} onChange={setRestaurant} />
          <Text style={styles.body}>Customer</Text>
          <Stars value={customer} onChange={setCustomer} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={() => void save()} disabled={saving} style={styles.primary}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Submit rating</Text>
            )}
          </Pressable>
          <Pressable onPress={close} style={styles.secondary}>
            <Text style={styles.secondaryText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
