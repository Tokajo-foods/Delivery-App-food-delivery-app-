import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/**
 * Android's CropImageContract crashes the whole app when the crop URI is null
 * (cancel / OEM quirks). Keep in-picker crop on iOS only.
 */
export function imagePickerAllowsEditing(preferEdit = true): boolean {
  if (!preferEdit) return false;
  return Platform.OS === 'ios';
}

type LibraryOpts = {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
  selectionLimit?: number;
};

export async function launchLibraryImage(
  opts: LibraryOpts = {}
): Promise<ImagePicker.ImagePickerResult> {
  const {
    aspect,
    quality = 0.85,
    allowsEditing = true,
    allowsMultipleSelection,
    selectionLimit,
  } = opts;

  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: imagePickerAllowsEditing(allowsEditing),
    ...(aspect && imagePickerAllowsEditing(allowsEditing) ? { aspect } : {}),
    quality,
    ...(allowsMultipleSelection
      ? { allowsMultipleSelection: true, selectionLimit }
      : {}),
  });
}

export async function launchCameraImage(
  opts: LibraryOpts = {}
): Promise<ImagePicker.ImagePickerResult> {
  const { aspect, quality = 0.85, allowsEditing = true } = opts;

  return ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: imagePickerAllowsEditing(allowsEditing),
    ...(aspect && imagePickerAllowsEditing(allowsEditing) ? { aspect } : {}),
    quality,
  });
}
