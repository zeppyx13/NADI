import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web.
 * Uses useSyncExternalStore to avoid the lint error with setState inside useEffect.
 */

let hydrated = false;

function subscribe(callback: () => void) {
  if (!hydrated) {
    hydrated = true;
    // Notify on next tick so the component re-renders after hydration
    queueMicrotask(callback);
  }
  return () => {};
}

function getSnapshot() {
  return hydrated;
}

function getServerSnapshot() {
  return false;
}

export function useColorScheme() {
  const hasHydrated = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
