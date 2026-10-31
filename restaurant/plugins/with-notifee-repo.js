const { withProjectBuildGradle } = require('expo/config-plugins');

const MARKER = '@notifee/react-native/android/libs';
const REPO = `maven { url "$rootDir/../node_modules/${MARKER}" }`;

/**
 * Notifee ships `app.notifee:core` as a local Maven repo inside node_modules and registers it from
 * its own build.gradle, which is too late for :app under configure-on-demand. Declare it at the root.
 */
module.exports = function withNotifeeRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    const src = cfg.modResults.contents;
    if (!src.includes(MARKER)) {
      cfg.modResults.contents = src.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        (block) => `${block}\n    ${REPO}`
      );
    }
    return cfg;
  });
};
