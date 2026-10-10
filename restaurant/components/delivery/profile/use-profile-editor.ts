import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useUpdatePartnerProfile } from '@/lib/delivery-partner/hooks';
import {
  VEHICLE_TYPE_OPTIONS,
  type DeliveryPartnerProfile,
  type UpdatePartnerProfilePayload,
  type VehicleType,
} from '@/lib/delivery-partner/types';
import { getApiErrorMessage } from '@/lib/errors';
import {
  formatAccountError,
  usePlatformAccountMutations,
} from '@/lib/user/account-hooks';
import type { PlatformUser } from '@/lib/user/account-types';
import { useAuthStore } from '@/store/auth-store';

export type ProfileEditSection = 'personal' | 'vehicle' | 'password' | null;

type Args = {
  profile?: DeliveryPartnerProfile | null;
  platform?: PlatformUser | null;
  photoUrl?: string | null;
  emailVerified: boolean;
  accountEmail: string;
};

export function useProfileEditor({
  profile,
  platform,
  photoUrl,
  emailVerified,
  accountEmail,
}: Args) {
  const updateProfile = useUpdatePartnerProfile();
  const { updateName, uploadPhoto, deletePhoto } = usePlatformAccountMutations();
  const changePassword = useAuthStore((s) => s.changePassword);
  const resendEmailVerification = useAuthStore((s) => s.resendEmailVerification);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editSection, setEditSection] = useState<ProfileEditSection>(null);
  const [saving, setSaving] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const openEdit = (section: ProfileEditSection) => {
    if (!profile || !section) return;
    if (section === 'personal') {
      setFirstName(platform?.firstName ?? profile.firstName ?? '');
      setLastName(platform?.lastName ?? profile.lastName ?? '');
      setDateOfBirth(profile.dateOfBirth ?? '');
    }
    if (section === 'vehicle') {
      const rawType = (profile.vehicle?.type ?? profile.vehicleType ?? '')
        .toLowerCase()
        .replace(/\s+/g, '_');
      setVehicleType(VEHICLE_TYPE_OPTIONS.find((o) => o.value === rawType)?.value ?? '');
      setVehicleNumber(profile.vehicle?.number ?? profile.vehicleNumber ?? '');
      setVehicleModel(profile.vehicle?.model ?? profile.vehicleModel ?? '');
      setVehicleColor(profile.vehicle?.color ?? profile.vehicleColor ?? '');
    }
    if (section === 'password') {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    }
    setEditSection(section);
  };

  const closeEdit = () => {
    if (saving || passwordBusy) return;
    setPasswordError(null);
    setEditSection(null);
  };

  const saveEdit = async () => {
    if (!editSection || editSection === 'password') return;
    if (editSection === 'personal') {
      if (firstName.trim().length < 2) {
        Alert.alert('First name required', 'Enter at least 2 characters.');
        return;
      }
      setSaving(true);
      try {
        await updateName.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim() });
        setEditSection(null);
        Alert.alert('Saved', 'Your name was updated.');
      } catch (err) {
        Alert.alert('Update failed', formatAccountError(err, 'Could not update your name.'));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!vehicleType) {
      Alert.alert('Vehicle type required', 'Please select a vehicle type.');
      return;
    }
    const payload: UpdatePartnerProfilePayload = {
      vehicleType,
      vehicleNumber: vehicleNumber.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleColor: vehicleColor.trim(),
    };
    setSaving(true);
    try {
      await updateProfile.mutateAsync(payload);
      setEditSection(null);
      Alert.alert('Saved', 'Your vehicle details were updated.');
    } catch (err) {
      Alert.alert('Update failed', getApiErrorMessage(err, 'Could not update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const submitPasswordChange = async () => {
    setPasswordError(null);
    if (oldPassword.length < 6) return setPasswordError('Enter your current password.');
    if (newPassword.length < 6) return setPasswordError('New password must be at least 6 characters.');
    if (newPassword !== confirmPassword) return setPasswordError('New passwords do not match.');
    setPasswordBusy(true);
    try {
      const message = await changePassword({ oldPassword, newPassword, confirmPassword });
      setEditSection(null);
      Alert.alert('Password updated', message || 'Your password was changed.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPasswordBusy(false);
    }
  };

  const uploadFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload a profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: Platform.OS === 'ios',
      aspect: [1, 1],
      exif: false,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploadingPhoto(true);
    try {
      await uploadPhoto.mutateAsync({
        uri: result.assets[0].uri,
        name: `profile-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      Alert.alert('Uploaded', 'Profile photo updated.');
    } catch (err) {
      Alert.alert('Upload failed', formatAccountError(err, 'Could not upload profile photo.'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onPhoto = () => {
    if (!photoUrl) {
      void uploadFromLibrary();
      return;
    }
    Alert.alert('Profile photo', 'Update the photo on your account.', [
      { text: 'Change photo', onPress: () => void uploadFromLibrary() },
      {
        text: 'Remove photo',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setUploadingPhoto(true);
            try {
              await deletePhoto.mutateAsync();
              Alert.alert('Removed', 'Profile photo removed.');
            } catch (err) {
              Alert.alert('Could not remove photo', formatAccountError(err, 'Please try again.'));
            } finally {
              setUploadingPhoto(false);
            }
          })();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onResendEmail = async () => {
    if (emailVerified) {
      Alert.alert('Already verified', 'Your email is already verified.');
      return;
    }
    setResendingEmail(true);
    try {
      const message = await resendEmailVerification();
      Alert.alert(
        'Email sent',
        message || `Verification link sent to ${accountEmail || 'your inbox'}.`
      );
    } catch (err) {
      Alert.alert('Could not send email', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  return {
    uploadingPhoto,
    resendingEmail,
    openEdit,
    onPhoto,
    onResendEmail: () => void onResendEmail(),
    edit: {
      editSection,
      closeEdit,
      saving,
      passwordBusy,
      firstName,
      setFirstName,
      lastName,
      setLastName,
      dateOfBirth,
      vehicleType,
      setVehicleType,
      vehicleNumber,
      setVehicleNumber,
      vehicleModel,
      setVehicleModel,
      vehicleColor,
      setVehicleColor,
      oldPassword,
      setOldPassword,
      newPassword,
      setNewPassword,
      confirmPassword,
      setConfirmPassword,
      passwordError,
      saveEdit,
      submitPasswordChange,
    },
  };
}
