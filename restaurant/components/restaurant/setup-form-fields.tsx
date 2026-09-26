import { Image } from 'expo-image';
import type { LucideIcon } from 'lucide-react-native';
import { Check, UploadCloud } from 'lucide-react-native';
import { Pressable, Text, TextInput, View } from 'react-native';

import { RequiredLabel } from '@/components/restaurant/SetupProgress';
import { cardShadow, theme } from '@/constants/theme';

export function FormSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className="gap-4 rounded-2xl border border-gray-100 bg-white p-4"
      style={cardShadow}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon color={theme.primary} size={18} />
        </View>
        <View className="flex-1 pt-0.5">
          <Text className="text-base font-extrabold text-secondary">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-xs leading-4 text-secondary-light">{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function SetupField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  required,
  maxLength,
  autoCapitalize,
  hint,
  hintError,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad';
  required?: boolean;
  maxLength?: number;
  autoCapitalize?: 'none' | 'characters';
  hint?: string;
  hintError?: boolean;
}) {
  return (
    <View>
      {required ? (
        <RequiredLabel>{label}</RequiredLabel>
      ) : (
        <Text className="mb-1.5 text-sm font-semibold text-secondary">{label}</Text>
      )}
      <View
        className={`h-[52px] justify-center rounded-2xl border bg-[#F8FAFC] px-4 ${
          hintError ? 'border-danger bg-danger/5' : 'border-gray-200'
        }`}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.muted}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className="text-[15px] text-secondary"
        />
      </View>
      {hint ? (
        <Text
          className={`mt-1.5 text-[11px] font-medium ${
            hintError ? 'text-danger' : 'text-secondary-light'
          }`}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function SetupTextArea({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View>
      <Text className="mb-1.5 text-sm font-semibold text-secondary">{label}</Text>
      <View className="rounded-2xl border border-gray-200 bg-[#F8FAFC] px-4 py-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Tell customers what makes your kitchen special…"
          placeholderTextColor={theme.muted}
          multiline
          className="min-h-[88px] text-[15px] text-secondary"
          textAlignVertical="top"
        />
      </View>
    </View>
  );
}

export function ImagePickCard({
  title,
  subtitle,
  uri,
  onPick,
  required,
}: {
  title: string;
  subtitle: string;
  uri?: string;
  onPick: () => void;
  required?: boolean;
}) {
  return (
    <Pressable
      onPress={onPick}
      className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white"
      style={cardShadow}
    >
      <View className="flex-row items-center justify-between px-3 py-2.5">
        <View className="flex-1 pr-2">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-secondary-light">
            {title}
            {required ? <Text className="text-danger"> *</Text> : null}
          </Text>
          <Text className="text-[11px] text-gray-400">{subtitle}</Text>
        </View>
        {uri ? (
          <View className="h-6 w-6 items-center justify-center rounded-full bg-success">
            <Check color="#FFFFFF" size={12} />
          </View>
        ) : null}
      </View>
      <View className="h-28 items-center justify-center bg-[#FFF7ED]">
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="items-center gap-2">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <UploadCloud color={theme.primary} size={20} />
            </View>
            <Text className="text-xs font-semibold text-primary">Tap to upload</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export function SetupChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3.5 py-2.5 ${
        active ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          active ? 'text-primary' : 'text-secondary-light'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-2.5 flex-row items-start justify-between gap-3 border-b border-gray-100 pb-2.5">
      <Text className="text-xs font-medium text-secondary-light">{label}</Text>
      <Text className="flex-1 text-right text-xs font-semibold text-secondary" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
