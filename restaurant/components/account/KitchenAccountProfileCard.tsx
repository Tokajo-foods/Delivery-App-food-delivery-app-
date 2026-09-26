import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { authTheme } from '@/constants/auth-theme';
import { fonts } from '@/constants/typography';
import {
  formatAccountError,
  usePlatformAccountMutations,
} from '@/lib/user/account-hooks';
import {
  displayPlatformName,
  type PlatformUser,
} from '@/lib/user/account-types';

export function KitchenAccountProfileCard({ user }: { user: PlatformUser }) {
  const mutations = usePlatformAccountMutations();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
  }, [user]);

  const displayName = displayPlatformName(user) || user.email || 'Owner';
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] ?? 'O').toUpperCase();
  }, [displayName]);

  const saveName = async () => {
    try {
      await mutations.updateName.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      Alert.alert('Saved', 'Your name was updated.');
    } catch (error) {
      Alert.alert(
        'Could not save name',
        formatAccountError(error, 'Try again.')
      );
    }
  };

  const pickAndUploadPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos needed', 'Allow photo access to upload a profile photo.');
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
    const asset = result.assets[0];
    setPhotoBusy(true);
    try {
      await mutations.uploadPhoto.mutateAsync({
        uri: asset.uri,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      Alert.alert('Uploaded', 'Profile photo updated.');
    } catch (error) {
      Alert.alert(
        'Upload failed',
        formatAccountError(error, 'Try another photo.')
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    try {
      await mutations.deletePhoto.mutateAsync();
      Alert.alert('Removed', 'Profile photo removed.');
    } catch (error) {
      Alert.alert(
        'Could not remove photo',
        formatAccountError(error, 'Try again.')
      );
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() =>
          Alert.alert(
            'Profile photo',
            'This photo is on your owner login, not the outlet logo.',
            [
              { text: 'Change photo', onPress: () => void pickAndUploadPhoto() },
              {
                text: 'Remove photo',
                style: 'destructive',
                onPress: () => void removePhoto(),
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          )
        }
        disabled={photoBusy}
        style={styles.photoRow}
      >
        {user.photoUrl ? (
          <Image
            source={{ uri: user.photoUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{displayName}</Text>
          <Text style={styles.meta}>
            {photoBusy ? 'Updating photo…' : 'Tap to change or remove photo'}
          </Text>
        </View>
      </Pressable>
      <Text style={styles.label}>First name</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First name"
        placeholderTextColor={authTheme.textDim}
        style={styles.input}
      />
      <Text style={styles.label}>Last name</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last name"
        placeholderTextColor={authTheme.textDim}
        style={styles.input}
      />
      <PrimaryButton
        label="Save name"
        loading={mutations.updateName.isPending}
        onPress={() => void saveName()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: authTheme.cardBorder,
    padding: 14,
    gap: 10,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 20 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: authTheme.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: authTheme.brand,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: authTheme.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: authTheme.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: authTheme.text,
    backgroundColor: '#FFFFFF',
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: authTheme.textMuted,
    lineHeight: 16,
  },
  rowLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: authTheme.text,
  },
});
