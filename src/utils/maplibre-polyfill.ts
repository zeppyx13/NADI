import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

let isPolyfilled = false;
let isNativeAvailable = false;

export function initMapLibrePolyfill(): void {
  if (isPolyfilled) return;
  isPolyfilled = true;

  if (Platform.OS === 'web') {
    isNativeAvailable = false;
    return;
  }

  try {
    const hasCamera = !!(
      TurboModuleRegistry.get('MLRNCameraModule') ||
      NativeModules?.MLRNCameraModule
    );
    const hasMapView = !!(
      TurboModuleRegistry.get('MLRNMapViewModule') ||
      NativeModules?.MLRNMapViewModule
    );
    isNativeAvailable = hasCamera && hasMapView;
  } catch {
    isNativeAvailable = false;
  }

  const originalGetEnforcing = TurboModuleRegistry.getEnforcing;
  TurboModuleRegistry.getEnforcing = function <T>(name: string): T {
    try {
      const mod = TurboModuleRegistry.get(name);
      if (mod) return mod as unknown as T;
    } catch {
      // ignore
    }

    try {
      return originalGetEnforcing(name) as unknown as T;
    } catch (err) {
      if (
        typeof name === 'string' &&
        (name.startsWith('MLRN') || name.startsWith('MLM'))
      ) {
        return new Proxy(
          {},
          {
            get(_target, prop) {
              if (prop === 'addListener' || prop === 'removeListeners') {
                return () => {};
              }
              return () => {};
            },
          },
        ) as unknown as T;
      }
      throw err;
    }
  };
}

export function isMapLibreNativeAvailable(): boolean {
  if (!isPolyfilled) {
    initMapLibrePolyfill();
  }
  return isNativeAvailable;
}

// Auto-initialize on import
initMapLibrePolyfill();
