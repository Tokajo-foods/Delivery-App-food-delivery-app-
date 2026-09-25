import { Mail, Smartphone } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { theme } from '@/constants/theme';

type PasswordResetOtpSentModalProps = {
  visible: boolean;
  channel: 'email' | 'phone';
  destination: string;
  onContinue: () => void;
};

export function PasswordResetOtpSentModal({
  visible,
  channel,
  destination,
  onContinue,
}: PasswordResetOtpSentModalProps) {
  const via = channel === 'email' ? 'email' : 'SMS';
  const Icon = channel === 'email' ? Mail : Smartphone;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
      <Pressable
        onPress={onContinue}
        style={{
          flex: 1,
          backgroundColor: 'rgba(12,10,9,0.45)',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            paddingHorizontal: 24,
            paddingVertical: 28,
            borderWidth: 1,
            borderColor: '#F5F5F4',
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              height: 64,
              width: 64,
              borderRadius: 32,
              backgroundColor: '#FFF7ED',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Icon size={30} color={theme.primary} />
          </View>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 22,
              fontWeight: '800',
              color: theme.secondary,
              marginBottom: 8,
            }}
          >
            OTP sent
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 14,
              lineHeight: 21,
              color: theme.secondaryLight,
              marginBottom: 24,
            }}
          >
            A verification code has been sent by {via} to {destination}. Enter
            it on the next screen to continue. The code expires on a live
            countdown timer.
          </Text>
          <PrimaryButton label="Continue" onPress={onContinue} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
