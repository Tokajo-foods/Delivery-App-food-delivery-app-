import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';

type Props = {
  aadharNumber: string;
  acceptedTerms: boolean;
  onChange: (patch: { aadharNumber?: string; acceptedTerms?: boolean }) => void;
};

export function RegisterTermsStep({ aadharNumber, acceptedTerms, onChange }: Props) {
  return (
    <View>
      <AuthField
        label="Aadhaar number"
        placeholder="1234 5678 9012"
        keyboardType="number-pad"
        value={aadharNumber}
        onChangeText={(value) => onChange({ aadharNumber: value })}
      />
      <Pressable
        onPress={() => onChange({ acceptedTerms: !acceptedTerms })}
        className="mt-1 flex-row items-start gap-3"
      >
        <View
          className={`mt-0.5 h-5 w-5 items-center justify-center rounded border ${
            acceptedTerms ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
          }`}
        >
          {acceptedTerms ? <Check color="#FFFFFF" size={12} /> : null}
        </View>
        <Text className="flex-1 text-sm leading-5 text-secondary-light">
          I agree to the Terms & Conditions and Privacy Policy
        </Text>
      </Pressable>
    </View>
  );
}
