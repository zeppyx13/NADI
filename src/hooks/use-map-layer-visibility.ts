import { useCallback, useEffect, useState } from 'react';

import { initialLayerVisibility } from '@/constants/map';
import {
  readMapLayerVisibility,
  writeMapLayerVisibility,
} from '@/storage/map-layer-storage';
import type { MapLayerId, MapLayerVisibility } from '@/types/map';

export type MapLayerVisibilityState = {
  layerVisibility: MapLayerVisibility;
  toggleLayer: (layer: MapLayerId) => void;
  /** True when the user has moved away from the default set. */
  hasCustomLayers: boolean;
};

const layerIds = Object.keys(initialLayerVisibility) as MapLayerId[];

/**
 * Layer visibility, restored from the previous session. Visibility only: the
 * repositories never read this, so a hidden layer is still available to NADI.
 */
export function useMapLayerVisibility(): MapLayerVisibilityState {
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>(
    initialLayerVisibility,
  );

  useEffect(() => {
    let cancelled = false;
    void readMapLayerVisibility().then((stored) => {
      if (!cancelled && stored) setLayerVisibility(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLayer = useCallback((layer: MapLayerId) => {
    setLayerVisibility((current) => {
      const next = { ...current, [layer]: !current[layer] };
      void writeMapLayerVisibility(next);
      return next;
    });
  }, []);

  const hasCustomLayers = layerIds.some(
    (layer) => layerVisibility[layer] !== initialLayerVisibility[layer],
  );

  return { layerVisibility, toggleLayer, hasCustomLayers };
}
