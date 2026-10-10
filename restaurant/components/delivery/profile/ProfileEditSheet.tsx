import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/constants/typography';
import { VEHICLE_TYPE_OPTIONS, type VehicleType } from '@/lib/delivery-partner/types';

import type { ProfileEditSection } from '@/components/delivery/profile/use-profile-editor';

type Props = {
  editSection: ProfileEditSection;
  closeEdit: () => void;
  saving: boolean;
  passwordBusy: boolean;
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  dateOfBirth: string;
  vehicleType: VehicleType | '';
  setVehicleType: (v: VehicleType) => void;
  vehicleNumber: string;
  setVehicleNumber: (v: string) => void;
  vehicleModel: string;
  setVehicleModel: (v: string) => void;
  vehicleColor: string;
  setVehicleColor: (v: string) => void;
  oldPassword: string;
  setOldPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordError: string | null;
  saveEdit: () => Promise<void>;
  submitPasswordChange: () => Promise<void>;
};

export function ProfileEditSheet(props: Props) {
  const insets = useSafeAreaInsets();
  const title =
    props.editSection === 'personal'
      ? 'Edit name'
      : props.editSection === 'vehicle'
        ? 'Edit vehicle'
        : props.editSection === 'password'
          ? 'Change password'
          : '';

  return (
    <Modal visible={props.editSection != null} animationType="slide" transparent onRequestClose={props.closeEdit}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={props.closeEdit} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={props.closeEdit} style={styles.close}>
              <X color="#64748B" size={18} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {props.editSection === 'personal' ? (
              <>
                <Field label="First name" value={props.firstName} onChangeText={props.setFirstName} />
                <Field label="Last name" value={props.lastName} onChangeText={props.setLastName} />
                <Text style={styles.hint}>Phone and email use a one-time code from the profile page.</Text>
                <Text style={styles.label}>Date of birth</Text>
                <View style={styles.readOnly}>
                  <Text style={styles.readOnlyText}>{props.dateOfBirth.trim() || 'Not set'}</Text>
                </View>
              </>
            ) : null}
            {props.editSection === 'vehicle' ? (
              <>
                <Text style={styles.label}>Type</Text>
                <View style={styles.options}>
                  {VEHICLE_TYPE_OPTIONS.map((opt) => {
                    const selected = props.vehicleType === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => props.setVehicleType(opt.value)}
                        style={[styles.option, selected && styles.optionOn]}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextOn]}>{opt.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Field label="Number" value={props.vehicleNumber} onChangeText={props.setVehicleNumber} caps="characters" />
                <Field label="Model" value={props.vehicleModel} onChangeText={props.setVehicleModel} />
                <Field label="Color" value={props.vehicleColor} onChangeText={props.setVehicleColor} />
              </>
            ) : null}
            {props.editSection === 'password' ? (
              <>
                <Text style={styles.hint}>Use your current password, then choose a new one (min. 6 characters).</Text>
                {props.passwordError ? <Text style={styles.error}>{props.passwordError}</Text> : null}
                <Field label="Current password" value={props.oldPassword} onChangeText={props.setOldPassword} secure />
                <Field label="New password" value={props.newPassword} onChangeText={props.setNewPassword} secure />
                <Field label="Confirm password" value={props.confirmPassword} onChangeText={props.setConfirmPassword} secure />
              </>
            ) : null}
          </ScrollView>
          <Pressable
            onPress={() => void (props.editSection === 'password' ? props.submitPasswordChange() : props.saveEdit())}
            disabled={props.saving || props.passwordBusy}
            style={styles.save}
          >
            {props.saving || props.passwordBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>{props.editSection === 'password' ? 'Update password' : 'Save'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secure,
  caps,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  caps?: 'none' | 'words' | 'characters';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize={caps ?? (secure ? 'none' : 'words')}
        placeholderTextColor="#94A3B8"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18, color: '#0F172A' },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F3F0',
  },
  field: { marginBottom: 10 },
  label: { fontFamily: fonts.semiBold, fontSize: 12, color: '#64748B', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#F1EAE3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  readOnly: {
    borderWidth: 1,
    borderColor: '#F1EAE3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F6F3F0',
  },
  readOnlyText: { fontFamily: fonts.medium, fontSize: 14, color: '#64748B' },
  hint: { fontFamily: fonts.medium, fontSize: 12, color: '#94A3B8', lineHeight: 18, marginBottom: 10 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: '#B91C1C', marginBottom: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  option: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F6F3F0' },
  optionOn: { backgroundColor: '#FFF1E8' },
  optionText: { fontFamily: fonts.medium, fontSize: 12, color: '#64748B' },
  optionTextOn: { fontFamily: fonts.semiBold, color: '#EA4B14' },
  save: {
    marginTop: 8,
    backgroundColor: '#EA4B14',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: { fontFamily: fonts.bold, fontSize: 15, color: '#FFFFFF' },
});
