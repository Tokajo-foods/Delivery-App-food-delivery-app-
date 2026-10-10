import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { lockedPartnerRole } from '@/lib/app-variant';
import { PARTNER_ROLES, type PartnerRole } from '@/lib/auth/types';

type RoleSelectorProps = {
  value: PartnerRole;
  onChange: (role: PartnerRole) => void;
  disabled?: boolean;
};

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  const locked = lockedPartnerRole();
  const roles = locked
    ? PARTNER_ROLES.filter((role) => role.value === locked)
    : PARTNER_ROLES;

  useEffect(() => {
    if (locked && value !== locked) onChange(locked);
  }, [locked, onChange, value]);

  return (
    <View className="mb-5 flex-row overflow-hidden rounded-2xl bg-[#F3F4F6] p-1">
      {roles.map((role) => {
        const active = value === role.value;
        return (
          <Pressable
            key={role.value}
            disabled={disabled}
            onPress={() => onChange(role.value)}
            className={`flex-1 items-center justify-center rounded-xl py-2.5 ${
              active ? 'bg-white' : ''
            }`}
          >
            <Text
              className="text-sm"
              style={{
                color: active ? '#020617' : '#64748B',
                fontFamily: active ? fonts.semibold : fonts.regular,
                fontWeight: active ? '600' : '400',
              }}
            >
              {role.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
