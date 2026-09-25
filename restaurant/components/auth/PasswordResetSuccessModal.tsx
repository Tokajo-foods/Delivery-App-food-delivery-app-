import { CheckCircle2 } from 'lucide-react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { theme } from '@/constants/theme';

type PasswordResetSuccessModalProps = {
  visible: boolean;
  onSignIn: () => void;
};

export function PasswordResetSuccessModal({
  visible,
  onSignIn,
}: PasswordResetSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSignIn}>
      <Pressable
        onPress={onSignIn}
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
              backgroundColor: '#ECFDF5',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={34} color={theme.success} />
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
            Password updated
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
            Your password was reset successfully. Sign in with your new password
            to continue.
          </Text>
          <PrimaryButton label="Back to sign in" onPress={onSignIn} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
