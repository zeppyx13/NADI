import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialLayerVisibility } from '@/constants/map';
import type { MapLayerId, MapLayerVisibility } from '@/types/map';

/**
 * Persists which map layers the user chose to see.
 *
 * Only this preference is stored. Transient map state — the open bottom sheet,
 * the selected marker, the search query, playback position — is deliberately
 * left in memory so a relaunch always starts from a clean map.
 */
export const MAP_LAYER_STORAGE_KEY = 'nadi.mapLayerVisibility';

const layerIds = Object.keys(initialLayerVisibility) as MapLayerId[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Unknown or removed keys fall back to the current defaults. */
function parseVisibility(value: unknown): MapLayerVisibility | null {
  if (!isRecord(value)) return null;

  const parsed = { ...initialLayerVisibility };
  let matched = false;
  layerIds.forEach((layer) => {
    if (typeof value[layer] === 'boolean') {
      parsed[layer] = value[layer];
      matched = true;
    }
  });

  return matched ? parsed : null;
}

export async function readMapLayerVisibility(): Promise<MapLayerVisibility | null> {
  try {
    const stored = await AsyncStorage.getItem(MAP_LAYER_STORAGE_KEY);
    if (!stored) return null;
    return parseVisibility(JSON.parse(stored));
  } catch {
    return null;
  }
}

export async function writeMapLayerVisibility(
  visibility: MapLayerVisibility,
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      MAP_LAYER_STORAGE_KEY,
      JSON.stringify(visibility),
    );
  } catch {
    // The choice still applies for the current session.
  }
}
