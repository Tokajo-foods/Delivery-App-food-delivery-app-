import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { BRAND_NAME } from '@/constants/theme';

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Support', href: '/legal/support' },
] as const;

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
  const router = useRouter();

  return (
    <View className="mt-[28.4px] items-center gap-[10.8px]">
      <View className="flex-row items-center gap-[20.6px]">
        {LEGAL_LINKS.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href)}
            hitSlop={8}
            accessibilityRole="link"
            accessibilityLabel={item.label}
          >
            <Text className="text-xs font-semibold text-primary">{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="text-xs tracking-wide text-gray-400">
        © 2026 {BRAND_NAME}
      </Text>
    </View>
  );
}
