const fs = require('fs');
const path = require('path');

/**
 * Android push (Expo → FCM) needs the Firebase Android app config. One google-services.json can
 * list both packages (com.tokajofoods.restaurant + com.tokajofoods.delivery). EAS: file env GOOGLE_SERVICES_JSON.
 */
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON?.trim() ||
  (fs.existsSync(path.join(__dirname, 'google-services.json')) ? './google-services.json' : undefined);

/** Play rejects cleartext. Allow it only when this build's API is explicitly http (local dev). */
function usesCleartextTraffic(apiUrl) {
  return apiUrl.startsWith('http://');
}

function pluginsWithCleartext(plugins, allowCleartext) {
  return (plugins || []).map((plugin) => {
    if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
    const options = plugin[1] || {};
    return [
      'expo-build-properties',
      {
        ...options,
        android: {
          ...(options.android || {}),
          usesCleartextTraffic: allowCleartext,
        },
      },
    ];
  });
}

/** Merges env into Expo config (API URL + Google Maps SDK keys + OAuth). */
module.exports = ({ config }) => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
  if (!mapsKey) {
    console.warn(
      '[app.config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is empty — Maps SDK / Places will fail until set.'
    );
  }
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://api.tokajofoods.com';
  const allowCleartext = usesCleartextTraffic(apiUrl);
  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || '';
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || '';
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || '';
  const firebaseApiKey =
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() || '';
  const firebaseAuthDomain =
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || '';
  const firebaseProjectId =
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '';
  const firebaseAppId =
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() || '';
  const firebaseMessagingSenderId =
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || '';
  const firebaseStorageBucket =
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || '';

  const variant = process.env.EXPO_PUBLIC_APP_VARIANT?.trim().toLowerCase();
  const restaurantApp = variant === 'restaurant';
  const deliveryApp = variant === 'delivery';
  const appName = deliveryApp
    ? 'TOKAJO Delivery'
    : restaurantApp
      ? 'TOKAJO Restaurant'
      : config.name;
  const appScheme = deliveryApp
    ? 'tokajodelivery'
    : restaurantApp
      ? 'tokajorestaurant'
      : config.scheme;
  const androidPackage = deliveryApp
    ? 'com.tokajofoods.delivery'
    : config.android?.package;
  const iosBundle = deliveryApp
    ? 'com.tokajofoods.delivery'
    : config.ios?.bundleIdentifier;
  // Template/library-added permissions the app never uses: no alarm-triggered notifications, no shared-storage
  // writes, and overlay access is never requested from the user (declaring it alone grants nothing).
  const unusedPermissions = [
    'android.permission.SCHEDULE_EXACT_ALARM',
    'android.permission.WRITE_EXTERNAL_STORAGE',
    'android.permission.SYSTEM_ALERT_WINDOW',
  ];
  // Only the rider shares live location during a trip; Play rejects background location without that use.
  const riderOnlyPermissions = [
    'android.permission.ACCESS_BACKGROUND_LOCATION',
    'android.permission.FOREGROUND_SERVICE_LOCATION',
  ];
  const blockedPermissions = restaurantApp
    ? [...unusedPermissions, ...riderOnlyPermissions]
    : unusedPermissions;
  const appIcon = deliveryApp
    ? './assets/tokajo-delivery-logo.png'
    : restaurantApp
      ? './assets/tokajo-restaurant-logo.png'
      : config.icon;
  // Launcher masks keep only the centre 66%; these copies hold the logo inside that safe zone.
  const adaptiveIcon = deliveryApp
    ? { foregroundImage: './assets/tokajo-delivery-adaptive.png', backgroundColor: '#FDD803' }
    : restaurantApp
      ? { foregroundImage: './assets/tokajo-restaurant-adaptive.png', backgroundColor: '#FDD501' }
      : { foregroundImage: appIcon, backgroundColor: '#FFD100' };

  return {
    ...config,
    plugins: pluginsWithCleartext(config.plugins, allowCleartext),
    name: appName,
    scheme: appScheme,
    icon: appIcon,
    ios: {
      ...config.ios,
      bundleIdentifier: iosBundle,
      config: {
        ...(config.ios?.config || {}),
        googleMapsApiKey: mapsKey,
      },
      infoPlist: {
        ...(config.ios?.infoPlist || {}),
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    android: {
      ...config.android,
      package: androidPackage,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      permissions: (config.android?.permissions || []).filter(
        (p) => !blockedPermissions.includes(p) && !blockedPermissions.includes(`android.permission.${p}`)
      ),
      blockedPermissions,
      usesCleartextTraffic: allowCleartext,
      adaptiveIcon: {
        ...(config.android?.adaptiveIcon || {}),
        ...adaptiveIcon,
      },
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          apiKey: mapsKey,
        },
      },
    },
    web: {
      ...(config.web || {}),
      favicon: appIcon,
    },
    extra: {
      ...(config.extra || {}),
      apiUrl,
      appVariant: deliveryApp ? 'delivery' : restaurantApp ? 'restaurant' : 'combined',
      googleMapsApiKey: mapsKey,
      googleWebClientId,
      googleIosClientId,
      googleAndroidClientId,
      firebaseApiKey,
      firebaseAuthDomain,
      firebaseProjectId,
      firebaseAppId,
      firebaseMessagingSenderId,
      firebaseStorageBucket,
    },
  };
};
