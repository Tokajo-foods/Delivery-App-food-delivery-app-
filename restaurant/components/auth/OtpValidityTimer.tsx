import { Clock } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { theme } from '@/constants/theme';

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

type OtpValidityTimerProps = {
  secondsLeft: number;
  expired?: boolean;
};

/** Live countdown: “Code valid for MM:SS”. */
export function OtpValidityTimer({
  secondsLeft,
  expired = secondsLeft <= 0,
}: OtpValidityTimerProps) {
  if (expired) {
    return (
      <View className="flex-row items-center justify-center gap-1.5 rounded-xl bg-[#FEF2F2] px-3 py-2.5">
        <Clock size={14} color={theme.danger} />
        <Text className="text-xs font-semibold text-[#B91C1C]">
          Code expired — request a new one
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center gap-1.5 rounded-xl bg-[#FFF7ED] px-3 py-2.5">
      <Clock size={14} color={theme.primary} />
      <Text className="text-xs font-semibold text-[#9A3412]">
        Code valid for{' '}
        <Text className="font-bold text-primary">{formatMmSs(secondsLeft)}</Text>
      </Text>
    </View>
  );
}
