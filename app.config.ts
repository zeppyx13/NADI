import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Native Google Maps SDK keys are build-time values. They are intentionally not
 * prefixed with `EXPO_PUBLIC_` so they never end up inlined in the JS bundle,
 * and they are never printed to the console.
 *
 * Set them in `.env` (see `.env.example`) or as EAS secrets:
 *   GOOGLE_MAPS_API_KEY          shared fallback
 *   GOOGLE_MAPS_API_KEY_ANDROID  Android-restricted key
 *   GOOGLE_MAPS_API_KEY_IOS      iOS-restricted key
 */
const sharedMapsKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
const androidMapsKey =
  process.env.GOOGLE_MAPS_API_KEY_ANDROID?.trim() || sharedMapsKey;
const iosMapsKey = process.env.GOOGLE_MAPS_API_KEY_IOS?.trim() || sharedMapsKey;

type MapsPluginProps = {
  androidGoogleMapsApiKey?: string;
  iosGoogleMapsApiKey?: string;
};

const mapsPluginProps: MapsPluginProps = {
  ...(androidMapsKey ? { androidGoogleMapsApiKey: androidMapsKey } : {}),
  ...(iosMapsKey ? { iosGoogleMapsApiKey: iosMapsKey } : {}),
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'NADI',
  slug: config.slug ?? 'NADI',
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', mapsPluginProps],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'NADI memakai lokasi Anda untuk memusatkan peta dan memperkirakan waktu tempuh.',
      },
    ],
  ],
});
