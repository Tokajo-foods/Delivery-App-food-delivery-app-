import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

import type { UploadFile } from '@/components/onboarding/kyc-doc-meta';
import { KYC_FILE } from '@/lib/restaurant/onboarding-types';

function mimeFromAsset(asset: ImagePicker.ImagePickerAsset) {
  const mime = (asset.mimeType || '').toLowerCase();
  if (mime) return mime;
  const name = (asset.fileName || asset.uri).toLowerCase();
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function pickKycPhoto(): Promise<UploadFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permission needed', 'Allow photo library access to upload KYC.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > KYC_FILE.maxBytes) {
    Alert.alert('File too large', 'Each document must be under 8 MB.');
    return null;
  }
  const mime = mimeFromAsset(asset);
  const ext = mime.includes('png') ? 'png' : 'jpg';
  return {
    uri: asset.uri,
    fileName: asset.fileName || `kyc-${Date.now()}.${ext}`,
    mimeType: mime.startsWith('image/') ? mime : 'image/jpeg',
  };
}
