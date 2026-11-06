import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react-native';

import { fonts } from '@/constants/typography';
import { OrderCallPanel } from '@/components/call/OrderCallPanel';
import { CodUpiSheet } from '@/components/delivery/orders/CodUpiSheet';
import { FoodProofSheet } from '@/components/delivery/orders/FoodProofSheet';
import { useTripWithOrder } from '@/components/delivery/orders/use-trip-order';
import {
  deliveryPartnerApi,
  nextDeliveryAction,
  normalizeDeliveryStatus,
  resolveTripStep,
  type TripWorkflowAction,
} from '@/lib/delivery-partner/api';
import { isCodPayment } from '@/lib/delivery-partner/finance-types';
import { useDeliveryOrderMutations } from '@/lib/delivery-partner/hooks';
import {
  formatRtoError,
  formatTripError,
} from '@/lib/delivery-partner/rider-ack';
import { getApiErrorCode } from '@/lib/errors';
import {
  useOrderTracking,
  useTrackingStatus,
} from '@/lib/delivery-partner/tracking-hooks';
import {
  CANCEL_REASON_CODES,
  FAIL_REASON_CODES,
  RETURN_REASON_CODES,
  TRIP_ISSUE_CODES,
  type CancelReasonCode,
  type FailReasonCode,
  type PartnerDelivery,
  type ReturnReasonCode,
  type TripIssueCode,
  type UnreachableChannel,
} from '@/lib/delivery-partner/types';
import { formatInr } from '@/lib/format/money';
import { offerTripRating } from '@/lib/delivery-partner/trip-rating';

type SheetKey =
  | 'pickup'
  | 'otp'
  | 'cancel'
  | 'issue'
  | 'deliver'
  | 'rto'
  | 'return'
  | 'return_otp'
  | 'fail'
  | null;

type Props = {
  delivery: PartnerDelivery;
  geoBlocked?: boolean;
  geoHint?: string | null;
  /** Session sheet already has call on the stop card. */
  hideCallActions?: boolean;
};

type TripGeo = {
  atPickup?: boolean;
  atDrop?: boolean;
  pickupMeters?: number;
  dropMeters?: number;
} | null;

export function tripGeofenceState(
  status: string,
  geo?: TripGeo,
  step?: TripWorkflowAction
) {
  const action = step ?? nextDeliveryAction(status);
  // Missing tracking payload ≠ outside geofence. Still allow the tap so we can
  // ping GPS; the server returns GEOFENCE_NOT_MET if they are too far.
  if (!geo) return { blocked: false, hint: null as string | null };
  if (
    action === 'arrived' ||
    action === 'pickup' ||
    action === 'return_store' ||
    action === 'complete_return'
  ) {
    const blocked = false;
    return {
      blocked,
      hint: blocked
        ? action === 'return_store' || action === 'complete_return'
          ? 'You must be at the restaurant (150 m).'
          : `Get within ${geo.pickupMeters ?? 150}m of the restaurant.`
        : null,
    };
  }
  if (action === 'reached_customer' || action === 'deliver') {
    const blocked = !geo.atDrop;
    return {
      blocked,
      hint: blocked
        ? `Get within ${geo.dropMeters ?? 100}m of the customer.`
        : null,
    };
  }
  return { blocked: false, hint: null as string | null };
}

async function pickImage(fromCamera: boolean): Promise<string | null> {
  if (fromCamera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access for this photo.');
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    return result.canceled ? null : result.assets[0]?.uri ?? null;
  }
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo access to attach a file.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
  });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

function rtoRemainingSeconds(delivery: PartnerDelivery) {
  if (delivery.rtoTimerEndsAt) {
    const ms = Date.parse(delivery.rtoTimerEndsAt) - Date.now();
    if (Number.isFinite(ms)) return Math.max(0, Math.ceil(ms / 1000));
  }
  return delivery.rtoRemainingSeconds ?? null;
}

function formatClock(total: number) {
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function waitCopy(delivery: PartnerDelivery) {
  if (!delivery.waitStartedAt && !delivery.orderNotReadyCount) return null;
  const started = delivery.waitStartedAt
    ? Date.parse(delivery.waitStartedAt)
    : NaN;
  const mins =
    delivery.waitMinutes ??
    (Number.isFinite(started)
      ? Math.max(0, Math.round((Date.now() - started) / 60_000))
      : null);
  const parts = [
    mins != null ? `Waiting ${mins} min` : 'Waiting at restaurant',
    delivery.orderNotReadyCount
      ? `Kitchen pinged ${delivery.orderNotReadyCount}×`
      : null,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function TripLifecycleWithGeo({
  delivery,
}: {
  delivery: PartnerDelivery;
}) {
  const status = normalizeDeliveryStatus(delivery.status);
  const live =
    status === 'accepted' ||
    status === 'arrived' ||
    status === 'picked_up' ||
    status === 'out_for_delivery' ||
    status === 'at_customer' ||
    status === 'returning_to_restaurant';
  const trackingQuery = useOrderTracking({
    orderId: delivery.orderId,
    deliveryId: delivery.id,
    enabled: live,
  });
  const statusQuery = useTrackingStatus(
    delivery.id,
    live && Boolean(delivery.id)
  );
  const geo = (trackingQuery.data ?? statusQuery.data)?.geofence;
  const gate = tripGeofenceState(
    status,
    geo,
    resolveTripStep(delivery)
  );
  return (
    <TripLifecycleBar
      delivery={delivery}
      geoBlocked={gate.blocked}
      geoHint={gate.hint}
    />
  );
}

/**
 * Swiggy/Zomato-style stop actions after accept: restaurant wait/pickup,
 * on-the-way, drop OTP/POD/signature/deliver, plus cancel + report issue.
 */
export function TripLifecycleBar({
  delivery: tripDelivery,
  geoBlocked,
  geoHint,
  hideCallActions = false,
}: Props) {
  const mutations = useDeliveryOrderMutations();
  const tripStatus = normalizeDeliveryStatus(tripDelivery.status);
  const { delivery, orderContext } = useTripWithOrder(tripDelivery, {
    live:
      tripStatus === 'picked_up' ||
      tripStatus === 'out_for_delivery' ||
      tripStatus === 'at_customer',
  });
  const status = normalizeDeliveryStatus(delivery.status);
  const step = resolveTripStep(delivery);
  const atRestaurant = status === 'arrived';
  const atDrop = status === 'at_customer';
  const postAccept = status !== 'assigned';
  const foodPicked =
    status === 'picked_up' ||
    status === 'out_for_delivery' ||
    status === 'at_customer' ||
    status === 'returning_to_restaurant';
  const canCancel =
    !foodPicked &&
    (status === 'accepted' || status === 'arrived') &&
    delivery.canCancel !== false;
  const cancelRequiresNote =
    delivery.cancelRequiresNote === true || status === 'accepted';
  const canIssue = delivery.canReportIssue !== false && postAccept;
  const settledUpi = (delivery.settledVia ?? '').toLowerCase() === 'upi';
  const isCod = isCodPayment(delivery.paymentMethod);
  const codDue =
    isCod && !settledUpi && delivery.amount != null && delivery.amount > 0
      ? `${formatInr(delivery.amount)}`
      : null;
  const rtoEligible = status === 'out_for_delivery' || status === 'at_customer';
  const showCodUpi =
    isCod && status === 'at_customer' && !settledUpi && !delivery.cashCollected;

  const [sheet, setSheet] = useState<SheetKey>(null);
  const [showUpi, setShowUpi] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [checklistOk, setChecklistOk] = useState(true);
  const [pickupPhotoUri, setPickupPhotoUri] = useState<string | null>(null);
  const [dropPhotoUri, setDropPhotoUri] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [cancelCode, setCancelCode] = useState<CancelReasonCode>(
    'vehicle_breakdown'
  );
  const [issueCode, setIssueCode] = useState<TripIssueCode>(
    'customer_unreachable'
  );
  const [rtoChannel, setRtoChannel] = useState<UnreachableChannel>('call');
  const [returnCode, setReturnCode] = useState<ReturnReasonCode>(
    'customer_unreachable'
  );
  const [failCode, setFailCode] = useState<FailReasonCode>(
    'restaurant_closed'
  );
  const [, setRtoTick] = useState(0);

  const mutating =
    mutations.arrived.isPending ||
    mutations.orderNotReady.isPending ||
    mutations.waiting.isPending ||
    mutations.orderReady.isPending ||
    mutations.pickupVerify.isPending ||
    mutations.uploadPickupProof.isPending ||
    mutations.pickup.isPending ||
    mutations.onTheWay.isPending ||
    mutations.reachedCustomer.isPending ||
    mutations.verifyOtp.isPending ||
    mutations.captureSignature.isPending ||
    mutations.uploadPod.isPending ||
    mutations.deliver.isPending ||
    mutations.cancelTrip.isPending ||
    mutations.reportIssue.isPending ||
    mutations.customerUnreachable.isPending ||
    mutations.returnToRestaurant.isPending ||
    mutations.completeReturn.isPending ||
    mutations.failTrip.isPending;

  const disabled = mutating || Boolean(busy);
  const rtoStep =
    status === 'returning_to_restaurant' ||
    step === 'return_store' ||
    step === 'complete_return';

  const run = async <T,>(label: string, fn: () => Promise<T>): Promise<T> => {
    setBusy(label);
    try {
      return await fn();
    } catch (error) {
      const code = getApiErrorCode(error);
      const rtoError =
        rtoStep ||
        (code != null &&
          (code.startsWith('RTO_') ||
            code === 'RETURN_HANDOVER_REQUIRED' ||
            code === 'RIDER_NOT_ARRIVED_FOR_RETURN' ||
            (code === 'GEOFENCE_NOT_MET' &&
              status === 'returning_to_restaurant')));
      Alert.alert(
        'Could not complete',
        rtoError
          ? formatRtoError(error, rtoRemainingSeconds(delivery))
          : formatTripError(error, label)
      );
      throw error;
    } finally {
      setBusy(null);
    }
  };

  const onArrived = () =>
    void run(
      status === 'returning_to_restaurant'
        ? 'Confirming you’re back at the restaurant…'
        : 'Marking arrived…',
      () => mutations.arrived.mutateAsync(delivery.id)
    )
      .then((next) => {
        const nextStatus = normalizeDeliveryStatus(next.status);
        const nextStep = resolveTripStep(next);
        if (
          nextStatus === 'returning_to_restaurant' ||
          nextStep === 'complete_return' ||
          next.nextAction === 'await_return_handover'
        ) {
          setOtp('');
          setSheet('return_otp');
          return;
        }
        setOtp('');
        setChecklistOk(true);
        setPickupPhotoUri(null);
        setSheet('pickup');
      })
      .catch(() => undefined);

  const onNotReady = () =>
    void run('Flagging kitchen wait…', () =>
      mutations.orderNotReady.mutateAsync(delivery.id)
    ).catch(() => undefined);

  const onWaiting = () =>
    void run('Marking waiting…', () =>
      mutations.waiting.mutateAsync(delivery.id)
    ).catch(() => undefined);

  const onReady = () =>
    void run('Confirming kitchen ready…', () =>
      mutations.orderReady.mutateAsync(delivery.id)
    ).catch(() => undefined);

  const onTheWay = () =>
    void run('Starting trip to customer…', () =>
      mutations.onTheWay.mutateAsync(delivery.id)
    ).catch(() => undefined);

  const onReached = () =>
    void run('Marking arrived at customer…', () =>
      mutations.reachedCustomer.mutateAsync(delivery.id)
    )
      .then(() => {
        if (isCod && !delivery.cashCollected) {
          setShowUpi(true);
          return;
        }
        setOtp('');
        setDropPhotoUri(delivery.proofPhotoUrl ?? null);
        setSheet('deliver');
      })
      .catch(() => undefined);

  const submitPickup = async () => {
    const code = otp.trim();
    const existingProof =
      delivery.pickupProofUrl?.startsWith('https://') === true
        ? delivery.pickupProofUrl
        : pickupPhotoUri?.startsWith('http')
          ? pickupPhotoUri
          : undefined;
    const hasLocalPhoto =
      Boolean(pickupPhotoUri) && !pickupPhotoUri!.startsWith('http');

    if (!/^\d{4}$/.test(code)) {
      Alert.alert('OTP required', 'Enter the 4-digit kitchen OTP.');
      return;
    }
    if (!existingProof && !hasLocalPhoto) {
      Alert.alert(
        'Parcel photo required',
        'Take a photo of the sealed parcel before leaving the restaurant.'
      );
      return;
    }

    setBusy('Uploading parcel photo…');
    try {
      let proofUrl = existingProof;
      if (hasLocalPhoto && pickupPhotoUri) {
        const uploaded = await mutations.uploadPickupProof.mutateAsync({
          deliveryId: delivery.id,
          photoUri: pickupPhotoUri,
        });
        proofUrl =
          uploaded.pickupProofUrl?.startsWith('https://')
            ? uploaded.pickupProofUrl
            : proofUrl;
      }
      if (!proofUrl?.startsWith('https://')) {
        Alert.alert(
          'Parcel photo required',
          'Upload failed — take the parcel photo again.'
        );
        return;
      }

      setBusy('Verifying pickup…');
      await mutations.pickupVerify.mutateAsync({
        deliveryId: delivery.id,
        payload: {
          otp: code || undefined,
          itemChecklistOk: checklistOk,
          photoUrl: proofUrl,
        },
      });
      setBusy('Picking up…');
      const picked = await mutations.pickup.mutateAsync({
        deliveryId: delivery.id,
        otp: code || undefined,
        photoUrl: proofUrl,
      });
      setSheet(null);
      setOtp('');
      setPickupPhotoUri(null);
      if (normalizeDeliveryStatus(picked.status) === 'picked_up') {
        setBusy('Heading to customer…');
        try {
          await mutations.onTheWay.mutateAsync(delivery.id);
        } catch (error) {
          Alert.alert(
            'Picked up',
            formatTripError(error, 'Tap “On the way to customer” to start the drop.')
          );
        }
      }
    } catch (error) {
      Alert.alert(
        'Could not pick up',
        formatTripError(
          error,
          'Enter the kitchen OTP, confirm the checklist, and upload a parcel photo.'
        )
      );
    } finally {
      setBusy(null);
    }
  };

  const submitDeliver = async () => {
    const code = otp.trim();
    if (!/^\d{4}$/.test(code) && !delivery.otpVerified) {
      Alert.alert('OTP required', 'Enter the 4-digit customer OTP.');
      return;
    }
    const localDrop = Boolean(dropPhotoUri) && !dropPhotoUri!.startsWith('http');
    if (!localDrop && !delivery.proofPhotoUrl?.startsWith('https://') && !dropPhotoUri?.startsWith('https://')) {
      Alert.alert(
        'Handover photo required',
        'Take a photo of handing the food to the customer.'
      );
      return;
    }
    setBusy('Saving handover photo…');
    try {
      let proofUrl = delivery.proofPhotoUrl?.startsWith('https://')
        ? delivery.proofPhotoUrl
        : dropPhotoUri?.startsWith('https://')
          ? dropPhotoUri
          : undefined;
      if (localDrop && dropPhotoUri) {
        const uploaded = await mutations.uploadPod.mutateAsync({
          deliveryId: delivery.id,
          photoUri: dropPhotoUri,
        });
        proofUrl = uploaded.proofPhotoUrl?.startsWith('https://')
          ? uploaded.proofPhotoUrl
          : proofUrl;
      }
      if (!proofUrl?.startsWith('https://')) {
        Alert.alert('Handover photo required', 'Upload failed — take the photo again.');
        return;
      }
      setBusy('Completing delivery…');
      await mutations.deliver.mutateAsync({
        deliveryId: delivery.id,
        payload: {
          otp: code || undefined,
          proofUrl,
          signatureUrl: delivery.signatureUrl,
        },
      });
      setSheet(null);
      setOtp('');
      setDropPhotoUri(null);
      offerTripRating(delivery.id);
      Alert.alert(
        'Delivered',
        codDue
          ? `Food handed over. ${codDue} cash is recorded as collected — remit it from Earnings.`
          : 'Food handed over. The photo is on the customer order.'
      );
    } catch (error) {
      Alert.alert('Could not complete', formatTripError(error, 'Enter the customer OTP and take the handover photo.'));
    } finally {
      setBusy(null);
    }
  };

  const submitCancel = async () => {
    if (cancelRequiresNote && note.trim().length < 5) {
      Alert.alert(
        'Remark required',
        'Write why you are cancelling (at least 5 characters).'
      );
      return;
    }
    try {
      await run('Cancelling trip…', () =>
        mutations.cancelTrip.mutateAsync({
          deliveryId: delivery.id,
          payload: {
            reasonCode: cancelCode,
            reason: note.trim() || undefined,
          },
        })
      );
      setSheet(null);
      setNote('');
      const profile = await deliveryPartnerApi.getMe().catch(() => null);
      if (profile?.status === 'suspended') {
        Alert.alert(
          'Account suspended',
          profile.suspendReason ||
            'You cancelled 3 trips. Your account is suspended for the next 3 hours.'
        );
      }
    } catch {
      // alerted
    }
  };

  const submitIssue = async () => {
    try {
      await run('Reporting issue…', () =>
        mutations.reportIssue.mutateAsync({
          deliveryId: delivery.id,
          payload: {
            issueCode,
            note: note.trim() || undefined,
          },
        })
      );
      setSheet(null);
      setNote('');
      const foodOut = ['picked_up', 'out_for_delivery', 'at_customer', 'arrived_at_customer'].includes(
        normalizeDeliveryStatus(delivery.status)
      );
      Alert.alert(
        foodOut ? 'Return the order' : 'Issue reported',
        foodOut
          ? 'Take the food back to the restaurant to finish this trip. You are paid the full amount shown on this order when the kitchen receives it. If you do not return the food, your account is suspended for 1 day.'
          : 'Issue saved. After you pick up the food, a report means you must return it to the restaurant.',
      );
    } catch {
      // alerted
    }
  };

  const submitUnreachable = async () => {
    try {
      const next = await run('Logging customer wait…', () =>
        mutations.customerUnreachable.mutateAsync({
          deliveryId: delivery.id,
          payload: {
            channel: rtoChannel,
            note: note.trim() || undefined,
          },
        })
      );
      setSheet(null);
      setNote('');
      const attempts = next.contactAttemptCount ?? 1;
      Alert.alert(
        attempts >= 2 ? '5-minute wait started' : 'Attempt logged',
        attempts >= 2
          ? 'If no one comes down, you can return the order after the timer.'
          : 'Try calling or chatting once more if they still don’t answer.'
      );
    } catch {
      // alerted
    }
  };

  const submitReturn = async () => {
    try {
      await run('Starting return…', () =>
        mutations.returnToRestaurant.mutateAsync({
          deliveryId: delivery.id,
          payload: {
            reasonCode: returnCode,
            reason: note.trim() || undefined,
          },
        })
      );
      setSheet(null);
      setNote('');
      const fee = delivery.rtoFee;
      Alert.alert(
        'Returning to restaurant',
        fee && fee > 0
          ? `Take the food back to the restaurant. Do not collect cash. You’ll earn ${formatInr(fee)} for returning this order.`
          : 'Take the food back to the restaurant. Do not collect cash.'
      );
    } catch {
      // alerted
    }
  };

  const submitCompleteReturn = async () => {
    const code = otp.trim();
    if (!/^\d{4}$/.test(code)) {
      Alert.alert('OTP required', 'Enter the 4-digit kitchen return OTP.');
      return;
    }
    try {
      await run('Handing order back to kitchen…', () =>
        mutations.completeReturn.mutateAsync({
          deliveryId: delivery.id,
          payload: { method: 'otp', otp: code },
        })
      );
      setSheet(null);
      setOtp('');
    } catch {
      // alerted — keep OTP so they can retry
    }
  };

  const submitFail = async () => {
    if (failCode === 'other' && !note.trim()) {
      Alert.alert('Note required', 'Add a short note when the reason is Other.');
      return;
    }
    try {
      await run('Marking failed…', () =>
        mutations.failTrip.mutateAsync({
          deliveryId: delivery.id,
          payload: {
            reasonCode: failCode,
            reason: note.trim() || undefined,
          },
        })
      );
      setSheet(null);
      setNote('');
      const profile = await deliveryPartnerApi.getMe().catch(() => null);
      Alert.alert(
        'Account suspended',
        profile?.suspendReason ||
          'The food was not returned to the restaurant. Your account is suspended for 1 day.',
      );
    } catch {
      // alerted
    }
  };

  const rtoLeft = rtoRemainingSeconds(delivery);
  useEffect(() => {
    if (rtoLeft == null) return;
    const timer = setInterval(() => setRtoTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [delivery.rtoTimerEndsAt, rtoLeft]);

  const waitingLabel = waitCopy(delivery);
  const primaryDisabled = disabled || Boolean(geoBlocked);
  const showOnTheWay =
    status === 'picked_up' ||
    (step === 'on_the_way' && status !== 'out_for_delivery' && !atDrop);
  const showArriveCustomer =
    (status === 'out_for_delivery' || step === 'reached_customer') &&
    status !== 'picked_up' &&
    !atDrop;

  const paySheet = (
    <CodUpiSheet
      visible={showUpi}
      deliveryId={delivery.id}
      amount={delivery.amount}
      tripStatus={status}
      settledVia={delivery.settledVia}
      onClose={() => setShowUpi(false)}
      onCompleted={() => setShowUpi(false)}
    />
  );

  if (
    status === 'assigned' ||
    status === 'delivered' ||
    status === 'cancelled' ||
    status === 'rejected' ||
    status === 'reassigned' ||
    status === 'failed' ||
    status === 'returned'
  ) {
    return paySheet;
  }

  return (
    <View style={{ gap: 6 }}>
      {busy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color="#EA4B14" size="small" />
          <Text style={styles.busyText}>{busy}</Text>
        </View>
      ) : null}

      {geoBlocked && geoHint ? (
        <Text style={styles.geoHint}>{geoHint}</Text>
      ) : null}

      {waitingLabel ? <Text style={styles.waitText}>{waitingLabel}</Text> : null}

      {step === 'arrived' ? (
        <Pressable
          onPress={onArrived}
          disabled={primaryDisabled}
          style={[styles.primary, primaryDisabled && styles.disabled]}
        >
          <Text style={styles.primaryText}>Arrived at restaurant</Text>
        </Pressable>
      ) : null}

      {atRestaurant ? (
        <View style={styles.group}>
          <Pressable
            onPress={onNotReady}
            disabled={disabled}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Order not ready</Text>
          </Pressable>
          <Pressable
            onPress={onWaiting}
            disabled={disabled}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Waiting at store</Text>
          </Pressable>
          <Pressable
            onPress={onReady}
            disabled={disabled}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>
              {delivery.kitchenReadyAt ? 'Kitchen ready ✓' : 'Kitchen ready'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setOtp('');
              setChecklistOk(true);
              setSheet('pickup');
            }}
            disabled={primaryDisabled}
            style={[styles.primary, primaryDisabled && styles.disabled]}
          >
            <Text style={styles.primaryText}>
              {delivery.pickupVerified ? 'Pick up order' : 'Verify & pick up'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {showOnTheWay ? (
        <Pressable
          onPress={onTheWay}
          disabled={disabled}
          style={[styles.primary, disabled && styles.disabled]}
        >
          <Text style={styles.primaryText}>On the way to customer</Text>
        </Pressable>
      ) : null}

      {showArriveCustomer ? (
        <Pressable
          onPress={onReached}
          disabled={primaryDisabled}
          style={[styles.primary, primaryDisabled && styles.disabled]}
        >
          <Text style={styles.primaryText}>Arrived at customer</Text>
        </Pressable>
      ) : null}

      {atDrop ? (
        <View style={styles.group}>
          <Text style={styles.proofMeta}>
            {[
              delivery.otpVerified ? 'OTP verified' : 'Customer OTP',
              delivery.proofPhotoUrl ? 'Handover photo saved' : 'Handover photo',
              isCod
                ? settledUpi
                  ? 'COD paid by UPI — do not collect cash'
                  : `COD — collect ${codDue ?? 'payment'} by cash or UPI`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Pressable
            onPress={() => {
              if (showCodUpi || settledUpi) {
                setShowUpi(true);
                return;
              }
              setOtp(delivery.otpVerified ? otp : '');
              setDropPhotoUri(delivery.proofPhotoUrl ?? dropPhotoUri);
              setSheet('deliver');
            }}
            disabled={primaryDisabled}
            style={[styles.primary, primaryDisabled && styles.disabled]}
          >
            <Text style={styles.primaryText}>
              {showCodUpi ? 'Collect payment' : settledUpi ? 'Payment received' : 'Hand over food'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {status === 'picked_up' ||
      status === 'out_for_delivery' ||
      status === 'at_customer' ? (
        <View style={styles.group}>
          {delivery.contactAttemptCount ? (
            <Text style={styles.waitText}>
              Customer contact {delivery.contactAttemptCount}×
              {rtoLeft != null
                ? rtoLeft > 0
                  ? ` · Return in ${formatClock(rtoLeft)}`
                  : ' · Timer done'
                : ''}
            </Text>
          ) : null}
          {rtoEligible ? (
          <>
          <Pressable
            onPress={() => {
              setNote('');
              setRtoChannel('call');
              setSheet('rto');
            }}
            disabled={disabled}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Customer not answering</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setNote('');
              setReturnCode('customer_refused');
              setSheet('return');
            }}
            disabled={disabled}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>Customer refused</Text>
          </Pressable>
          {delivery.canReturnToRestaurant ? (
            <Pressable
              onPress={() => {
                setNote('');
                setReturnCode('customer_unreachable');
                setSheet('return');
              }}
              disabled={disabled}
              style={[styles.primary, disabled && styles.disabled]}
            >
              <Text style={styles.primaryText}>Return to restaurant</Text>
            </Pressable>
          ) : rtoLeft != null && rtoLeft > 0 ? (
            <Text style={styles.waitText}>
              Wait {formatClock(rtoLeft)} before returning.
            </Text>
          ) : null}
          </>
          ) : null}
        </View>
      ) : null}

      {status === 'returning_to_restaurant' ? (
        <View style={styles.group}>
          <Text style={styles.waitText}>
            Take the food back to the restaurant to finish this trip. If you do not return it, your account is suspended for 1 day. Do not collect cash.
          </Text>
          {delivery.rtoFee && delivery.rtoFee > 0 ? (
            <Text style={styles.waitText}>
              You’ll be paid {formatInr(delivery.rtoFee)}, the full amount shown for this trip, when the kitchen receives the food.
            </Text>
          ) : null}
          {step === 'return_store' ? (
            <Pressable
              onPress={onArrived}
              disabled={primaryDisabled}
              style={[styles.primary, primaryDisabled && styles.disabled]}
            >
              <Text style={styles.primaryText}>
                I’ve arrived at the restaurant
              </Text>
            </Pressable>
          ) : null}
          {step === 'complete_return' ? (
            <>
              <Text style={styles.waitText}>
                Ask kitchen for the return OTP, or wait if they tap Receive.
              </Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="Kitchen return OTP"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                style={styles.input}
                maxLength={4}
              />
              <Pressable
                onPress={() => void submitCompleteReturn()}
                disabled={disabled}
                style={[styles.primary, disabled && styles.disabled]}
              >
                <Text style={styles.primaryText}>Confirm return OTP</Text>
              </Pressable>
            </>
          ) : null}
          <Pressable
            onPress={() => {
              setNote('');
              setFailCode('restaurant_closed');
              setSheet('fail');
            }}
            disabled={disabled}
            style={styles.secondary}
          >
            <Text style={styles.secondaryText}>
              Restaurant closed — won’t take bag
            </Text>
          </Pressable>
        </View>
      ) : null}

      {postAccept && !hideCallActions && delivery.orderId ? (
        <OrderCallPanel
          orderId={delivery.orderId}
          viewer="rider"
          names={{
            customer: delivery.customerName || 'Customer',
            restaurant: delivery.restaurantName || 'Restaurant',
          }}
        />
      ) : null}

      {postAccept ? (
        <View style={styles.moreRow}>
          {canIssue ? (
            <Pressable
              onPress={() => {
                setNote('');
                setSheet('issue');
              }}
              disabled={disabled}
              style={styles.moreBtn}
            >
              <Text style={styles.moreText}>Report issue</Text>
            </Pressable>
          ) : null}
          {canCancel ? (
            <Pressable
              onPress={() => {
                setNote('');
                setSheet('cancel');
              }}
              disabled={disabled}
              style={styles.moreBtn}
            >
              <Text style={styles.moreDanger}>Cancel trip</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <FoodProofSheet
        visible={sheet === 'pickup' || sheet === 'deliver'}
        mode={sheet === 'deliver' ? 'handover' : 'pickup'}
        otp={otp}
        photoUri={
          sheet === 'deliver'
            ? dropPhotoUri ?? delivery.proofPhotoUrl ?? null
            : pickupPhotoUri ?? delivery.pickupProofUrl ?? null
        }
        busy={disabled}
        onOtp={setOtp}
        onClose={() => setSheet(null)}
        onTakePhoto={() =>
          void pickImage(true).then((uri) => {
            if (!uri) return;
            if (sheet === 'deliver') setDropPhotoUri(uri);
            else setPickupPhotoUri(uri);
          })
        }
        onChoosePhoto={() =>
          void pickImage(false).then((uri) => {
            if (!uri) return;
            if (sheet === 'deliver') setDropPhotoUri(uri);
            else setPickupPhotoUri(uri);
          })
        }
        onSubmit={() => void (sheet === 'deliver' ? submitDeliver() : submitPickup())}
      />

      <Modal
        visible={sheet === 'return_otp'}
        transparent
        animationType="fade"
        onRequestClose={() => setSheet(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Show this to kitchen</Text>
              <Pressable onPress={() => setSheet(null)} hitSlop={8}>
                <X color="#6B7280" size={20} />
              </Pressable>
            </View>
            <Text style={styles.sub}>
              Ask kitchen for the return OTP, or wait if they tap Receive. This
              is not the customer drop OTP.
            </Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="4-digit kitchen return OTP"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              style={styles.input}
              maxLength={4}
              autoFocus
            />
            <Pressable
              onPress={() => void submitCompleteReturn()}
              disabled={disabled}
              style={[styles.primary, disabled && styles.disabled]}
            >
              <Text style={styles.primaryText}>Confirm return OTP</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={sheet === 'cancel' || sheet === 'issue'}
        transparent
        animationType="fade"
        onRequestClose={() => setSheet(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {sheet === 'cancel' ? 'Cancel trip' : 'Report issue'}
              </Text>
              <Pressable onPress={() => setSheet(null)} hitSlop={8}>
                <X color="#6B7280" size={20} />
              </Pressable>
            </View>
            <Text style={styles.sub}>
              {sheet === 'cancel'
                ? 'Cancel is only before you pick up the food. Three cancels in a day suspends your account for 3 hours.'
                : rtoEligible || status === 'picked_up'
                  ? 'You have the food. Reporting an issue now ends the drop — you must return the food to the restaurant to finish this trip.'
                  : 'Saved on the trip timeline for support. Your trip continues as normal.'}
            </Text>
            <View style={styles.chips}>
              {(sheet === 'cancel' ? CANCEL_REASON_CODES : TRIP_ISSUE_CODES).map(
                (row) => {
                  const selected =
                    sheet === 'cancel'
                      ? cancelCode === row.code
                      : issueCode === row.code;
                  return (
                    <Pressable
                      key={row.code}
                      onPress={() => {
                        if (sheet === 'cancel') {
                          setCancelCode(row.code as CancelReasonCode);
                        } else {
                          setIssueCode(row.code as TripIssueCode);
                        }
                      }}
                      style={[styles.chip, selected && styles.chipOn]}
                    >
                      <Text
                        style={[styles.chipText, selected && styles.chipTextOn]}
                      >
                        {row.label}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={
                sheet === 'cancel' && cancelRequiresNote
                  ? 'Remark required (why cancel?)'
                  : sheet === 'cancel'
                    ? 'Optional note'
                    : 'Optional note'
              }
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
            />
            <Pressable
              onPress={() =>
                void (sheet === 'cancel' ? submitCancel() : submitIssue())
              }
              disabled={disabled}
              style={sheet === 'cancel' ? styles.danger : styles.primary}
            >
              <Text style={styles.primaryText}>
                {sheet === 'cancel' ? 'Confirm cancel' : 'Submit issue'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={sheet === 'rto' || sheet === 'return' || sheet === 'fail'}
        transparent
        animationType="fade"
        onRequestClose={() => setSheet(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {sheet === 'rto'
                  ? 'Customer not answering'
                  : sheet === 'return'
                    ? 'Return to restaurant'
                    : 'Mark delivery failed'}
              </Text>
              <Pressable onPress={() => setSheet(null)} hitSlop={8}>
                <X color="#6B7280" size={20} />
              </Pressable>
            </View>
            <Text style={styles.sub}>
              {sheet === 'rto'
                ? 'Attempt 2 starts a 5-minute wait. Then you can return the order.'
                : sheet === 'return'
                  ? 'Customer refused returns immediately. Other reasons need two contact attempts and the timer.'
                  : 'Only if the restaurant will not take the bag. Your account is suspended for 1 day because the food was not returned.'}
            </Text>
            {sheet === 'rto' ? (
              <View style={styles.chips}>
                {(['call', 'chat'] as const).map((channel) => (
                  <Pressable
                    key={channel}
                    onPress={() => setRtoChannel(channel)}
                    style={[
                      styles.chip,
                      rtoChannel === channel && styles.chipOn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        rtoChannel === channel && styles.chipTextOn,
                      ]}
                    >
                      {channel === 'call' ? 'After a call' : 'After chat'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.chips}>
                {(sheet === 'return'
                  ? RETURN_REASON_CODES
                  : FAIL_REASON_CODES.filter((row) =>
                      status === 'returning_to_restaurant'
                        ? row.code === 'restaurant_closed'
                        : true
                    )
                ).map(
                  (row) => {
                    const selected =
                      sheet === 'return'
                        ? returnCode === row.code
                        : failCode === row.code;
                    return (
                      <Pressable
                        key={row.code}
                        onPress={() => {
                          if (sheet === 'return') {
                            setReturnCode(row.code as ReturnReasonCode);
                          } else {
                            setFailCode(row.code as FailReasonCode);
                          }
                        }}
                        style={[styles.chip, selected && styles.chipOn]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextOn,
                          ]}
                        >
                          {row.label}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            )}
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional note"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
            />
            <Pressable
              onPress={() =>
                void (sheet === 'rto'
                  ? submitUnreachable()
                  : sheet === 'return'
                    ? submitReturn()
                    : submitFail())
              }
              disabled={disabled}
              style={sheet === 'fail' ? styles.danger : styles.primary}
            >
              <Text style={styles.primaryText}>
                {sheet === 'rto'
                  ? 'Log unreachable'
                  : sheet === 'return'
                    ? 'Start return'
                    : 'Mark failed'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {paySheet}
    </View>
  );
}

const styles = StyleSheet.create({
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  geoHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#B45309',
  },
  waitText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#C2410C',
  },
  group: {
    gap: 8,
  },
  proofMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  primary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondary: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  secondaryText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#111827',
  },
  disabled: {
    opacity: 0.5,
  },
  moreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  moreBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1EAE3',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  moreText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#1E293B',
  },
  unlockNote: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  unlockText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#9A3412',
    textAlign: 'center',
  },
  moreDanger: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#B91C1C',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: '#111827',
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#111827',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  checkOn: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#111827',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: '#111827',
  },
  chipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#4B5563',
  },
  chipTextOn: {
    color: '#FFFFFF',
  },
  danger: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
