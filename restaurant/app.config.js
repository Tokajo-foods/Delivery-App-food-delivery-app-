/** Merges env into Expo config (API URL + Google Maps SDK keys + OAuth). */
module.exports = ({ config }) => {
  const mapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
  if (!mapsKey) {
    console.warn(
      '[app.config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is empty — Maps SDK / Places will fail until set.'
    );
  }
  const apiUrl =
    process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://10.12.129.12:4000';
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
  const appIcon = deliveryApp
    ? './assets/tokajo-delivery-logo.png'
    : restaurantApp
      ? './assets/tokajo-restaurant-logo.png'
      : config.icon;

  return {
    ...config,
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
      usesCleartextTraffic: true,
      adaptiveIcon: {
        ...(config.android?.adaptiveIcon || {}),
        foregroundImage: appIcon,
        backgroundColor: '#FFD100',
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
