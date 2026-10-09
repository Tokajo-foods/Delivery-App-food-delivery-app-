import { Pressable, Text, View } from 'react-native';

import { PARTNER_ROLES, type PartnerRole } from '@/lib/auth/types';

type RoleSelectorProps = {
  value: PartnerRole;
  onChange: (role: PartnerRole) => void;
  disabled?: boolean;
};

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <View className="mb-5 flex-row rounded-2xl bg-[#F6F3F0] p-1">
      {PARTNER_ROLES.map((role) => {
        const active = value === role.value;
        return (
          <Pressable
            key={role.value}
            disabled={disabled}
            onPress={() => onChange(role.value)}
            className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
              active ? 'bg-[#FFF1E8]' : 'bg-transparent'
            }`}
            style={
              active
                ? { borderWidth: 1, borderColor: '#F3C4AE' }
                : { borderWidth: 1, borderColor: 'transparent' }
            }
          >
            <Text
              className={`text-sm ${
                active
                  ? 'font-bold text-[#EA4B14]'
                  : 'font-semibold text-[#94A3B8]'
              }`}
            >
              {role.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
