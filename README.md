# NADI (Navigation Adaptive and Distribution Intelligence)

## GEMASTIK XIX Project By :

### 1. [Gung Nanda](https://www.github.com/zeppyx13)

### 2. [Nicho](https://github.com/arstd)

### 3. [Dewa Dharma](https://www.github.com/DwDhrm7)

## Unsplash Auth Hero

1. Create an Unsplash developer application.
2. Copy its Access Key, never the Secret Key.
3. Copy `.env.example` to `.env`.
4. Set `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` in `.env`.
5. Restart Expo after changing the environment value when necessary.

The auth flow remains usable without this key and falls back to the NADI brand gradient.

## Google Maps development build

The native map uses `react-native-maps` with the Google provider on both iOS and
Android. Google Maps ships native code, so the map does not run in Expo Go.

1. Copy `.env.example` to `.env`.
2. Set the native SDK key: `GOOGLE_MAPS_API_KEY`, or the per-platform
   `GOOGLE_MAPS_API_KEY_ANDROID` / `GOOGLE_MAPS_API_KEY_IOS` when the keys carry
   platform restrictions. These are build-time values injected by
   `app.config.ts`; they are never bundled into JavaScript.
3. Optionally set `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` to enable Google Places
   search on the map. Restrict that key to the Places API and set a quota cap.

After installing dependencies or changing the maps configuration, regenerate the
native projects and build locally. The repository ignores generated `ios/` and
`android/` directories, so preserve intentional native-only edits before running
the clean prebuild:

```bash
npx expo prebuild --clean
npm run ios
# or
npm run android
```

For later Metro sessions, target the installed NADI development build instead
of Expo Go:

```bash
npx expo start --dev-client --tunnel
```

Open the NADI app installed by `expo run:*`; opening the project in Expo Go will
fail because Expo Go does not contain the Google Maps native modules.

Without a Places key the search bar still works against the local NADI catalog.
Without a Maps SDK key the app still builds, but the basemap will not render.

The map, incident, crowd, and route overlays remain local deterministic NADI
data. A Google basemap does not make those values live or real-time.
