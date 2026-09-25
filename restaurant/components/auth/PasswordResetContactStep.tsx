import { Mail, Phone, Send } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { theme } from '@/constants/theme';

type Channel = 'email' | 'phone';

type Props = {
  channel: Channel;
  email: string;
  phone: string;
  fieldErrors: Record<string, string>;
  busy: boolean;
  cooldownActive: boolean;
  cooldownSeconds: number;
  onChannelChange: (channel: Channel) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onSend: () => void;
};

export function PasswordResetContactStep({
  channel,
  email,
  phone,
  fieldErrors,
  busy,
  cooldownActive,
  cooldownSeconds,
  onChannelChange,
  onEmailChange,
  onPhoneChange,
  onSend,
}: Props) {
  return (
    <View className="gap-3">
      <View className="mb-1 flex-row rounded-2xl bg-surface p-1">
        {(
          [
            { id: 'email' as const, label: 'Email', Icon: Mail },
            { id: 'phone' as const, label: 'Phone', Icon: Phone },
          ] as const
        ).map(({ id, label, Icon }) => {
          const selected = channel === id;
          return (
            <Pressable
              key={id}
              onPress={() => onChannelChange(id)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 ${
                selected ? 'bg-white' : ''
              }`}
              style={
                selected
                  ? {
                      shadowColor: '#000',
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }
                  : undefined
              }
            >
              <Icon
                size={16}
                color={selected ? theme.primary : theme.secondaryLight}
              />
              <Text
                className={`text-sm font-bold ${
                  selected ? 'text-secondary' : 'text-secondary-light'
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {channel === 'email' ? (
        <AuthField
          label="Email"
          icon={Mail}
          placeholder="you@business.com"
          autofill="email"
          value={email}
          onChangeText={onEmailChange}
          errorText={fieldErrors.email}
        />
      ) : (
        <AuthField
          label="Phone"
          icon={Phone}
          placeholder="+919876543210"
          autofill="telephone"
          value={phone}
          onChangeText={onPhoneChange}
          errorText={fieldErrors.phone}
        />
      )}

      <PrimaryButton
        label={
          cooldownActive
            ? `Resend in ${cooldownSeconds}s`
            : channel === 'email'
              ? 'Send email OTP'
              : 'Send SMS OTP'
        }
        icon={Send}
        onPress={onSend}
        loading={busy}
        disabled={busy || cooldownActive}
      />
    </View>
  );
}
