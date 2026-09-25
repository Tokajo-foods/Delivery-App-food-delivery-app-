import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { BRAND_NAME } from '@/constants/theme';

type CheckboxRowProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
};

export function CheckboxRow({ checked, onToggle, label }: CheckboxRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={6}
      className="flex-row items-center gap-2.5"
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-md border ${
          checked ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
        }`}
      >
        {checked ? <Check color="#FFFFFF" size={14} /> : null}
      </View>
      <Text className="text-sm text-secondary-light">{label}</Text>
    </Pressable>
  );
}

export function LegalFooter() {
  return (
    <View className="mt-8 items-center gap-2.5">
      <View className="flex-row items-center gap-5">
        {['Privacy', 'Terms', 'Support'].map((item) => (
          <Text key={item} className="text-xs font-medium text-secondary-light">
            {item}
          </Text>
        ))}
      </View>
      <Text className="text-xs tracking-wide text-gray-400">
        © 2026 {BRAND_NAME}
      </Text>
    </View>
  );
}
