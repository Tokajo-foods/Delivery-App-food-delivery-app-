import { ShieldCheck } from 'lucide-react-native';
import { useRef } from 'react';
import { Platform } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';

type Props = {
  value: string;
  onChange: (value: string) => void;
  /** Fired once per distinct 6-digit value (typing or OS SMS autofill). */
  onComplete: (code: string) => void;
  editable?: boolean;
  label?: string;
  errorText?: string;
};

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  editable = true,
  label = '6-digit OTP',
  errorText,
}: Props) {
  const lastSubmitted = useRef<string | null>(null);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    onChange(digits);
    if (digits.length < 6) {
      lastSubmitted.current = null;
      return;
    }
    if (lastSubmitted.current === digits) return;
    lastSubmitted.current = digits;
    onComplete(digits);
  };

  return (
    <AuthField
      label={label}
      icon={ShieldCheck}
      placeholder="••••••"
      autofill="oneTimeCode"
      autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
      textContentType="oneTimeCode"
      keyboardType="number-pad"
      maxLength={6}
      autoFocus
      editable={editable}
      value={value}
      onChangeText={handleChange}
      errorText={errorText}
      style={{ letterSpacing: 6, fontSize: 18, fontWeight: '700' }}
    />
  );
}
