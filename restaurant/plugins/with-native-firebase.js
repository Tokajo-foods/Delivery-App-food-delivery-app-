const path = require('path');
const { withPlugins } = require('expo/config-plugins');

// RNFB's package "exports" hides the per-platform plugin builds; load them by file path.
const android = require(
  path.join(path.dirname(require.resolve('@react-native-firebase/app/package.json')), 'plugin/build/android'),
);

/**
 * Android-only native Firebase: phone OTP via Play Integrity (no reCAPTCHA modal).
 * iOS excludes RNFB in package.json `expo.autolinking.ios.exclude`; use a native iOS build when enabled.
 */
 */
module.exports = function withNativeFirebase(config) {
  return withPlugins(config, [
    android.withBuildscriptDependency,
    android.withApplyGoogleServicesPlugin,
    android.withCopyAndroidGoogleServices,
  ]);
};
