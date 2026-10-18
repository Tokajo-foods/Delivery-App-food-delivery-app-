import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { VEHICLE_TYPE_OPTIONS, type VehicleType } from '@/lib/delivery-partner/types';

type Props = {
  vehicleType: VehicleType | '';
  vehicleNumber: string;
  onChange: (patch: { vehicleType?: VehicleType; vehicleNumber?: string }) => void;
};

export function RegisterVehicleStep({ vehicleType, vehicleNumber, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text className="mb-1.5 text-sm font-semibold text-secondary">Vehicle type *</Text>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="mb-3 h-12 justify-center rounded-xl border border-gray-200 bg-white px-3.5"
      >
        <Text className={`text-[15px] ${vehicleType ? 'text-secondary' : 'text-secondary-light'}`}>
          {VEHICLE_TYPE_OPTIONS.find((o) => o.value === vehicleType)?.label ?? 'Select vehicle type'}
        </Text>
      </Pressable>
      {open ? (
        <View className="mb-4 overflow-hidden rounded-xl border border-gray-200">
          {VEHICLE_TYPE_OPTIONS.map((option) => {
            const active = option.value === vehicleType;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange({ vehicleType: option.value });
                  setOpen(false);
                }}
                className={`px-3.5 py-3 ${active ? 'bg-primary/10' : 'bg-white'}`}
              >
                <Text
                  className={`text-sm ${active ? 'font-bold text-primary' : 'font-medium text-secondary'}`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <AuthField
        label="Vehicle number"
        placeholder="DL-01-AB-1234"
        autoCapitalize="characters"
        value={vehicleNumber}
        onChangeText={(value) => onChange({ vehicleNumber: value })}
      />
    </View>
  );
}
