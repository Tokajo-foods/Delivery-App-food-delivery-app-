# Release / AAB — UI asset quality

## Bundled images

- Use **PNG** for logos, splash, and marketing art (avoid lossy WebP/JPEG in the UI chrome).
- Name density variants for Metro: `asset.png`, `asset@2x.png`, `asset@3x.png` at pixel sizes matching layout **dp** × density (e.g. wordmark layout 156×40 dp → 156×40, 312×80, 468×120 px).
- Render with `BundledImage` (`expo-image`, no transition, high priority).

## Android release build

- `app.json` → `expo-build-properties`: `enableShrinkResourcesInReleaseBuilds: false` so Gradle does not strip unused drawables from the AAB.
- Ship with EAS profile **`production-restaurant`** and verify on a **release** install (not Metro dev client).

## Remote images (menu, logos from API)

Upload quality is controlled by `lib/media/to-uploadable-image.ts` and CDN transforms — separate from the AAB bundle.
