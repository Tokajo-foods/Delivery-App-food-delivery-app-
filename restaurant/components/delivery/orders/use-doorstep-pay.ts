import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { deliveryPartnerApi } from '@/lib/delivery-partner/api';
import {
  formatFinanceError,
  partnerFinanceApi,
} from '@/lib/delivery-partner/finance-api';
import type { CodUpiQr } from '@/lib/delivery-partner/finance-types';
import { useFinanceMutations } from '@/lib/delivery-partner/finance-hooks';
import { deliveryPartnerKeys } from '@/lib/delivery-partner/hooks';
import { pushLiveToast } from '@/lib/delivery-partner/live-toast-store';
import { offerTripRating } from '@/lib/delivery-partner/trip-rating';
import { PartnerApiError } from '@/lib/errors';
import { formatInr } from '@/lib/format/money';

type Args = {
  visible: boolean;
  deliveryId: string | null;
  amount?: number | null;
  tripStatus?: string | null;
  settledVia?: string | null;
  onCompleted: () => void;
};

function errorCode(error: unknown) {
  return error instanceof PartnerApiError ? error.code : undefined;
}

export function useDoorstepPay({
  visible,
  deliveryId,
  amount,
  tripStatus,
  settledVia,
  onCompleted,
}: Args) {
  const queryClient = useQueryClient();
  const { createUpiQr } = useFinanceMutations();
  const [qr, setQr] = useState<CodUpiQr | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'collect' | 'working' | 'done'>('collect');
  const [cashError, setCashError] = useState<string | null>(null);
  const finishing = useRef(false);
  const refreshedExpiry = useRef<string | null>(null);

  const celebrate = (body: string) => {
    setPhase('done');
    if (deliveryId) offerTripRating(deliveryId);
    pushLiveToast({ title: 'Delivery complete', body, tone: 'success' });
    void queryClient.invalidateQueries({ queryKey: deliveryPartnerKeys.all });
    setTimeout(() => onCompleted(), 900);
  };

  const finish = async (kind: 'upi' | 'cash') => {
    if (!deliveryId || finishing.current) return;
    finishing.current = true;
    setPhase('working');
    setCashError(null);
    try {
      if (kind === 'cash') {
        try {
          await partnerFinanceApi.collectDoorstepCash(deliveryId);
        } catch (error) {
          if (errorCode(error) !== 'COD_ALREADY_SETTLED') throw error;
          await partnerFinanceApi.completeDoorstepUpi(deliveryId);
        }
      } else {
        await partnerFinanceApi.completeDoorstepUpi(deliveryId);
      }
      celebrate(
        kind === 'cash'
          ? 'Cash recorded. This trip is done.'
          : 'Payment received. This trip is done.'
      );
    } catch (error) {
      finishing.current = false;
      setPhase('collect');
      if (errorCode(error) === 'UPI_NOT_RECEIVED') return;
      setCashError(
        formatFinanceError(
          error,
          kind === 'cash' ? 'Could not record cash.' : 'Could not complete the trip.'
        )
      );
    }
  };

  useEffect(() => {
    if (!visible || !deliveryId) {
      setQr(null);
      setLoadError(null);
      setCashError(null);
      setPhase('collect');
      finishing.current = false;
      return;
    }
    let cancelled = false;
    setLoadError(null);
    createUpiQr
      .mutateAsync(deliveryId)
      .then((data) => {
        if (cancelled) return;
        if ((data.settledVia ?? '').toLowerCase() === 'upi') {
          void finish('upi');
          return;
        }
        setQr(data);
      })
      .catch((error) => {
        if (cancelled) return;
        if (errorCode(error) === 'COD_ALREADY_SETTLED') {
          void finish('upi');
          return;
        }
        setLoadError(formatFinanceError(error, 'Could not create the payment QR.'));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, deliveryId]);

  useEffect(() => {
    if (!visible || !deliveryId || phase !== 'collect') return;
    let stop = false;
    const watch = async () => {
      try {
        const [row, order] = await Promise.all([
          deliveryPartnerApi.getDelivery(deliveryId),
          deliveryPartnerApi.getDeliveryOrderContext(deliveryId).catch(() => null),
        ]);
        if (stop || finishing.current) return;
        if (row.status === 'delivered') {
          finishing.current = true;
          celebrate('Payment received. This trip is done.');
          return;
        }
        const paid =
          (row.settledVia ?? '').toLowerCase() === 'upi'
          || (order?.paymentStatus ?? '').toLowerCase() === 'paid';
        if (paid && (row.status === 'at_customer' || tripStatus === 'at_customer')) {
          void finish('upi');
        }
      } catch {
        // Keep the QR up. The next poll retries.
      }
    };
    void watch();
    const timer = setInterval(() => void watch(), 3000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, deliveryId, phase, tripStatus]);

  useEffect(() => {
    if (!visible || phase === 'done' || finishing.current) return;
    if (tripStatus === 'delivered') {
      finishing.current = true;
      celebrate('Payment received. This trip is done.');
      return;
    }
    if ((settledVia ?? '').toLowerCase() === 'upi') {
      void finish('upi');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, tripStatus, settledVia]);

  const due = qr?.amount && qr.amount > 0 ? qr.amount : amount ?? null;
  const expired = Boolean(qr?.expiresAt && new Date(qr.expiresAt).getTime() <= Date.now());

  const refreshQr = () => {
    if (!deliveryId) return;
    setLoadError(null);
    setQr(null);
    createUpiQr
      .mutateAsync(deliveryId)
      .then(setQr)
      .catch((error) => {
        if (errorCode(error) === 'COD_ALREADY_SETTLED') {
          void finish('upi');
          return;
        }
        setLoadError(formatFinanceError(error, 'Could not create the payment QR.'));
      });
  };

  useEffect(() => {
    if (!visible || !expired || !qr?.expiresAt || phase !== 'collect') return;
    if (refreshedExpiry.current === qr.expiresAt) return;
    refreshedExpiry.current = qr.expiresAt;
    refreshQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, expired, qr?.expiresAt, phase]);

  const onCash = () => {
    const label = due != null ? formatInr(due) : 'the order amount';
    Alert.alert(
      'Paid in cash',
      `Confirm you received ${label} in notes. This completes the delivery and adds the cash to your cash in hand.`,
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Received cash', onPress: () => void finish('cash') },
      ]
    );
  };

  return {
    qr,
    loadError,
    cashError,
    phase,
    loading: phase === 'working' || (createUpiQr.isPending && !qr && !loadError),
    due,
    expired,
    imageUrl: qr?.qrImageUrl || null,
    refreshQr,
    onCash,
  };
}
