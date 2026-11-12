import { Image, type ImageContentFit, type ImageProps } from 'expo-image';
import { type ImageSourcePropType } from 'react-native';

type Props = Omit<ImageProps, 'source' | 'contentFit'> & {
  source: ImageSourcePropType;
  contentFit?: ImageContentFit;
};

/**
 * Bundled bitmaps for release/AAB — expo-image + no upscale blur on high-DPI screens.
 */
export function BundledImage({
  source,
  contentFit = 'contain',
  cachePolicy = 'memory-disk',
  transition = 0,
  ...rest
}: Props) {
  return (
    <Image
      {...rest}
      source={source}
      contentFit={contentFit}
      cachePolicy={cachePolicy}
      transition={transition}
      recyclingKey={
        typeof source === 'number'
          ? `bundled-${source}`
          : undefined
      }
      allowDownscaling
      priority="high"
    />
  );
}
