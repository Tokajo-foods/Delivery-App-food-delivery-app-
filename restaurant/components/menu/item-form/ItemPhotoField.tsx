import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { Alert, Pressable, Text } from 'react-native';

import type { ItemPhotoFile } from '@/components/menu/item-form/item-form-types';
import { menuModalStyles as styles } from '@/components/menu/menu-modal-styles';
import { authTheme } from '@/constants/auth-theme';
import { getApiErrorMessage } from '@/lib/errors';

export function ItemPhotoField({
  photoUri,
  disabled,
  onPicked,
  onRemove,
}: {
  photoUri?: string;
  disabled: boolean;
  onPicked: (file: ItemPhotoFile) => void;
  onRemove?: () => Promise<void>;
}) {
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload dish photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    onPicked({
      uri: asset.uri,
      name: asset.fileName ?? `item-${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    });
  };

  const confirmRemove = () => {
    if (!onRemove) return;
    Alert.alert('Remove photo?', 'Customers will see no dish image.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          void onRemove().catch((error) =>
            Alert.alert('Could not remove', getApiErrorMessage(error))
          ),
      },
    ]);
  };

  return (
    <>
      <Pressable style={styles.dishPhoto} onPress={() => void pickPhoto()} disabled={disabled}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.dishPhotoImg} contentFit="cover" />
        ) : (
          <>
            <Camera color={authTheme.textDim} size={22} />
            <Text style={styles.dishPhotoHint}>Add dish photo</Text>
          </>
        )}
      </Pressable>
      {onRemove ? (
        <Pressable onPress={confirmRemove} style={{ alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.modalCancelText}>Remove photo</Text>
        </Pressable>
      ) : null}
    </>
  );
}
