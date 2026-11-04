import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { UploadFilePart } from '@/lib/multipart-upload';

/** Server rejects files over 5 MB; keep the long edge readable for KYC review. */
const MAX_EDGE_PX = 2000;
const JPEG_QUALITY = 0.8;

function safeStem(name: string | undefined, fallback: string) {
  const base = (name ?? '').split(/[/\\]/).pop() ?? '';
  const stem = base.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return stem || fallback;
}

/**
 * Re-encode a picked photo as a real JPEG (HEIC / huge camera shots fail
 * multer's mime check or the 5 MB limit). Falls back to the original file
 * with its true mime type if the native module is unavailable.
 */
export async function toUploadableImage(
  uri: string,
  fileName?: string,
  mimeType?: string
): Promise<UploadFilePart> {
  const stem = safeStem(fileName, `upload-${Date.now()}`);
  try {
    const context = ImageManipulator.manipulate(uri);
    let image = await context.renderAsync();
    const longest = Math.max(image.width, image.height);
    if (longest > MAX_EDGE_PX) {
      context.resize(
        image.width >= image.height ? { width: MAX_EDGE_PX } : { height: MAX_EDGE_PX }
      );
      image = await context.renderAsync();
    }
    const saved = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: JPEG_QUALITY,
    });
    return { uri: saved.uri, name: `${stem}.jpg`, type: 'image/jpeg' };
  } catch {
    const type = mimeType?.trim() || 'image/jpeg';
    const ext = type === 'image/png' ? '.png' : type === 'image/webp' ? '.webp' : '.jpg';
    return { uri, name: `${stem}${ext}`, type };
  }
}
