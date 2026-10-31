import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { UploadFilePart } from '@/lib/multipart-upload';

/** Dish photos: small enough for a 5 MB multer cap and a fast Cloudinary hop. */
const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 0.72;

function safeStem(name: string | undefined, fallback: string) {
  const base = (name ?? '').split(/[/\\]/).pop() ?? '';
  const stem = base.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  return stem || fallback;
}

/** Re-encode as JPEG. HEIC / huge camera shots stall upload or hit 5 MB. */
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
