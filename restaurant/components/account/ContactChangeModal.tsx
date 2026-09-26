import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  contactChangeHint,
  contactChangeSuccessBody,
  contactChangeTitle,
  isValidContactEmail,
  normalizeContactPhone,
  type ContactChangeStep,
  type ContactKind,
} from '@/components/account/contact-change-copy';
import { contactChangeStyles as styles } from '@/components/account/contact-change-styles';
import { getApiErrorCode } from '@/lib/errors';
import {
  formatAccountError,
  usePlatformAccountMutations,
} from '@/lib/user/account-hooks';

/**
 * Dual-OTP contact change: verify current → new → success popup.
 */
export function ContactChangeModal({
  kind,
  onClose,
}: {
  kind: ContactKind | null;
  current?: string;
  onClose: () => void;
}) {
  const {
    sendCurrentContactOtp,
    verifyCurrentContactOtp,
    sendNewContactOtp,
    confirmNewContact,
  } = usePlatformAccountMutations();

  const [step, setStep] = useState<ContactChangeStep>('current_otp');
  const [otp, setOtp] = useState('');
  const [newValue, setNewValue] = useState('');
  const [masked, setMasked] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!kind) return;
    setStep('current_otp');
    setOtp('');
    setNewValue('');
    setMasked('');
    setError(null);
    setCooldown(0);
    setBusy(true);
    void sendCurrentContactOtp
      .mutateAsync(kind)
      .then((res) => {
        setMasked(res.maskedTarget);
        setCooldown(res.cooldownSeconds || 30);
      })
      .catch((err) => {
        setError(
          formatAccountError(err, 'Could not send OTP to your current contact.')
        );
      })
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when kind opens
  }, [kind]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!kind) return null;

  const isPhone = kind === 'phone';
  const title = contactChangeTitle(kind, step);

  const applyCooldown = (seconds: number, err?: unknown) => {
    if (seconds > 0) setCooldown(seconds);
    else if (getApiErrorCode(err) === 'OTP_COOLDOWN') setCooldown(30);
  };

  const onVerifyCurrent = async () => {
    setError(null);
    if (otp.trim().length < 4) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    setBusy(true);
    try {
      await verifyCurrentContactOtp.mutateAsync({
        channel: kind,
        otp: otp.trim(),
      });
      setOtp('');
      setStep('enter_new');
    } catch (err) {
      setError(formatAccountError(err, 'Could not verify OTP.'));
    } finally {
      setBusy(false);
    }
  };

  const onSendNew = async () => {
    setError(null);
    const value = isPhone
      ? normalizeContactPhone(newValue)
      : newValue.trim().toLowerCase();
    if (isPhone) {
      if (value.replace(/\D/g, '').length < 10) {
        setError('Enter a valid mobile number.');
        return;
      }
    } else if (!isValidContactEmail(value)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await sendNewContactOtp.mutateAsync({
        channel: kind,
        value,
      });
      setMasked(res.maskedTarget);
      setNewValue(value);
      applyCooldown(res.cooldownSeconds || 30);
      setOtp('');
      setStep('new_otp');
    } catch (err) {
      applyCooldown(0, err);
      setError(
        formatAccountError(err, 'Could not send OTP to the new contact.')
      );
    } finally {
      setBusy(false);
    }
  };

  const onConfirmNew = async () => {
    setError(null);
    if (otp.trim().length < 4) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    setBusy(true);
    try {
      await confirmNewContact.mutateAsync({
        channel: kind,
        value: newValue,
        otp: otp.trim(),
      });
      setStep('success');
    } catch (err) {
      setError(formatAccountError(err, 'Could not verify OTP.'));
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setBusy(true);
    try {
      if (step === 'current_otp') {
        const res = await sendCurrentContactOtp.mutateAsync(kind);
        setMasked(res.maskedTarget);
        applyCooldown(res.cooldownSeconds || 30);
      } else if (step === 'new_otp') {
        const res = await sendNewContactOtp.mutateAsync({
          channel: kind,
          value: newValue,
        });
        setMasked(res.maskedTarget);
        applyCooldown(res.cooldownSeconds || 30);
      }
    } catch (err) {
      applyCooldown(0, err);
      setError(formatAccountError(err, 'Could not resend OTP.'));
    } finally {
      setBusy(false);
    }
  };

  const primaryAction =
    step === 'current_otp'
      ? onVerifyCurrent
      : step === 'enter_new'
        ? onSendNew
        : step === 'new_otp'
          ? onConfirmNew
          : onClose;

  const primaryLabel =
    step === 'current_otp'
      ? 'Verify current'
      : step === 'enter_new'
        ? 'Send OTP to new'
        : step === 'new_otp'
          ? 'Verify & save'
          : 'Done';

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {step === 'success' ? (
            <View style={styles.successWrap}>
              <View style={styles.successBadge}>
                <Text style={styles.successCheck}>✓</Text>
              </View>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.successBody}>
                {contactChangeSuccessBody(kind)}
              </Text>
              {newValue ? (
                <Text style={styles.successValue}>{newValue}</Text>
              ) : null}
            </View>
          ) : (
            <>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.sheetHint}>
                {contactChangeHint(kind, step, masked)}
              </Text>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 'enter_new' ? (
            <TextInput
              value={newValue}
              onChangeText={setNewValue}
              placeholder={isPhone ? '9876543210' : 'you@example.com'}
              placeholderTextColor="#9CA3AF"
              keyboardType={isPhone ? 'phone-pad' : 'email-address'}
              autoCapitalize="none"
              style={styles.input}
            />
          ) : null}

          {step === 'current_otp' || step === 'new_otp' ? (
            <TextInput
              value={otp}
              onChangeText={(text) =>
                setOtp(text.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="6-digit OTP"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              style={styles.input}
            />
          ) : null}

          <Pressable
            onPress={() => void primaryAction()}
            disabled={busy}
            style={styles.primaryBtn}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            )}
          </Pressable>

          {step === 'current_otp' || step === 'new_otp' ? (
            <Pressable
              onPress={() => void onResend()}
              disabled={busy || cooldown > 0}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </Text>
            </Pressable>
          ) : null}

          {step !== 'success' ? (
            <Pressable onPress={onClose} style={styles.linkBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
