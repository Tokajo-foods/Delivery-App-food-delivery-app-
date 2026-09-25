import { Text, View } from 'react-native';

type Step = 'contact' | 'otp' | 'password';

const LABELS: Record<Step, string> = {
  contact: 'Contact',
  otp: 'OTP',
  password: 'Password',
};

export function PasswordResetStepHeader({ step }: { step: Step }) {
  const order: Step[] = ['contact', 'otp', 'password'];
  return (
    <View className="mb-5 flex-row gap-2">
      {order.map((s, i) => {
        const active = step === s;
        const done =
          (s === 'contact' && step !== 'contact') ||
          (s === 'otp' && step === 'password');
        return (
          <View key={s} className="flex-1">
            <View
              className={`h-1.5 rounded-full ${
                active || done ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
            <Text
              className={`mt-1.5 text-[11px] font-semibold ${
                active ? 'text-primary' : 'text-secondary-light'
              }`}
            >
              {i + 1}. {LABELS[s]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
