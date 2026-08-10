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

## MapLibre development build

The native map uses `@maplibre/maplibre-react-native`. MapLibre contains native
code, so the map does not run in Expo Go. After installing dependencies or
changing the MapLibre config plugin, regenerate the native configuration and
build the app locally. The repository ignores generated `ios/` and `android/`
directories, so preserve intentional native-only edits before running the clean
prebuild:

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
fail because Expo Go does not contain MapLibre's native modules.

Set `EXPO_PUBLIC_MAP_STYLE_URL` in `.env` to the MapLibre style URL provided for
the target environment. During development only, NADI falls back to the
MapLibre demo style when this value is empty. Production builds use a local
background fallback until a production tile/style provider is configured.

The map, incident, crowd, and route overlays remain local deterministic NADI
data. A remote basemap style does not make those values live or real-time.
