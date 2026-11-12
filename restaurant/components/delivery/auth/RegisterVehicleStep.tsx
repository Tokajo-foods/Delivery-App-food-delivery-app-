import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import { VEHICLE_TYPE_OPTIONS, type VehicleType } from '@/lib/delivery-partner/types';

type Props = {
  vehicleType: VehicleType | '';
  vehicleNumber: string;
  onChange: (patch: { vehicleType?: VehicleType; vehicleNumber?: string }) => void;
};

export function RegisterVehicleStep({ vehicleType, vehicleNumber, onChange }: Props) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: authTheme.textMuted }}>
        Primary vehicle
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {VEHICLE_TYPE_OPTIONS.map((option) => {
          const active = option.value === vehicleType;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange({ vehicleType: option.value })}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: active ? authTheme.text : authTheme.cardBorder,
                backgroundColor: active ? authTheme.text : authTheme.card,
              }}
            >
              <Text
                style={{
                  fontFamily: active ? fonts.semiBold : fonts.medium,
                  fontSize: 13,
                  color: active ? '#FFFFFF' : authTheme.text,
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <AuthField
        label="Registration number"
        placeholder="DL-01-AB-1234"
        autoCapitalize="characters"
        value={vehicleNumber}
        onChangeText={(value) =>
          onChange({ vehicleNumber: value.replace(/\s+/g, ' ').toUpperCase() })
        }
      />
    </View>
  );
}
