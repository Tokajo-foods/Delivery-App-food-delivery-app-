import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fonts } from '@/constants/typography';

type Mode = 'pickup' | 'handover';

type Props = {
  visible: boolean;
  mode: Mode;
  otp: string;
  photoUri: string | null;
  busy: boolean;
  onOtp: (value: string) => void;
  onClose: () => void;
  onTakePhoto: () => void;
  onChoosePhoto: () => void;
  onSubmit: () => void;
};

const COPY: Record<Mode, { title: string; sub: string; photo: string; action: string }> = {
  pickup: {
    title: 'Pick up the food',
    sub: 'Enter the kitchen OTP and photograph the packed order. The customer and admin will see this photo.',
    photo: 'Photo of the food at the restaurant',
    action: 'Confirm pickup',
  },
  handover: {
    title: 'Hand over the food',
    sub: 'Enter the customer OTP and photograph the handover. This photo is saved on the order and in admin.',
    photo: 'Photo of handing the food to the customer',
    action: 'Mark delivered',
  },
};

export function FoodProofSheet({
  visible,
  mode,
  otp,
  photoUri,
  busy,
  onOtp,
  onClose,
  onTakePhoto,
  onChoosePhoto,
  onSubmit,
}: Props) {
  const copy = COPY[mode];
  const digits = otp.replace(/\D/g, '').slice(0, 4);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{copy.title}</Text>
            <Pressable onPress={onClose} hitSlop={8} disabled={busy}>
              <X color="#6B7280" size={20} />
            </Pressable>
          </View>
          <Text style={styles.sub}>{copy.sub}</Text>

          <Text style={styles.label}>4-digit OTP</Text>
          <View style={styles.otpWrap}>
            <View style={styles.otpRow} pointerEvents="none">
              {[0, 1, 2, 3].map((index) => (
                <View key={index} style={[styles.box, digits[index] ? styles.boxOn : null]}>
                  <Text style={styles.digit}>{digits[index] ?? ''}</Text>
                </View>
              ))}
            </View>
            <TextInput
              value={digits}
              onChangeText={(value) => onOtp(value.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              style={styles.otpCapture}
              caretHidden
            />
          </View>

          <Text style={styles.label}>{copy.photo}</Text>
          <Pressable onPress={onTakePhoto} disabled={busy} style={styles.photo}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.preview} />
            ) : (
              <View style={styles.photoEmpty}>
                <Camera color="#EA4B14" size={28} />
                <Text style={styles.photoEmptyText}>Take photo</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={onChoosePhoto} disabled={busy} style={styles.gallery}>
            <ImageIcon color="#374151" size={16} />
            <Text style={styles.galleryText}>
              {photoUri ? 'Retake or choose another photo' : 'Choose from gallery'}
            </Text>
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={[styles.primary, busy && styles.disabled]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>{copy.action}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: '#111827',
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#111827',
    marginTop: 4,
  },
  otpWrap: {
    position: 'relative',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    borderColor: '#EA4B14',
    backgroundColor: '#FFF7F2',
  },
  digit: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: '#111827',
  },
  otpCapture: {
    ...StyleSheet.absoluteFill,
    opacity: 0.02,
    color: '#111827',
  },
  photo: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderColor: '#F3D5C4',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoEmptyText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: '#EA4B14',
  },
  gallery: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
  },
  galleryText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#374151',
  },
  primary: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#EA4B14',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryText: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.7,
  },
});
