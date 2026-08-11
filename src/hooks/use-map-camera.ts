import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type MapView from 'react-native-maps';

import { baliRegion, mapRegionDeltas } from '@/constants/map';
import { motion, spacing } from '@/constants/theme';
import type { MapLatLng, MapRegion } from '@/types/map';

type UseMapCameraOptions = {
  mapRef: RefObject<MapView | null>;
  isMapReady: boolean;
  /** Increment to request an explicit recenter. */
  recenterSignal: number;
  recenterTarget?: MapLatLng;
  /** Changing key marks a new explicit selection, not a re-render. */
  focusKey?: string;
  focusCoordinate?: MapLatLng;
  routeCoordinates: readonly MapLatLng[];
  fitRoute: boolean;
  viewportRevision: string;
};

const routeEdgePadding = {
  top: spacing[12],
  right: spacing[10],
  bottom: spacing[12],
  left: spacing[10],
};

function toRegion(coordinate: MapLatLng, delta: number): MapRegion {
  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

/**
 * Central camera control. The camera only moves for explicit events: a picked
 * search result, a tapped marker or cluster, a recenter press, or a confirmed
 * custom point. Nothing here reacts to plain re-renders.
 */
export function useMapCamera({
  mapRef,
  isMapReady,
  recenterSignal,
  recenterTarget,
  focusKey,
  focusCoordinate,
  routeCoordinates,
  fitRoute,
  viewportRevision,
}: UseMapCameraOptions) {
  const lastFocusKey = useRef<string | undefined>(undefined);
  const lastRouteKey = useRef<string | undefined>(undefined);
  const lastRecenterSignal = useRef(0);

  const focusRegion = useCallback(
    (region: MapRegion) => {
      mapRef.current?.animateToRegion(region, motion.slow);
    },
    [mapRef],
  );

  const focusPlace = useCallback(
    (coordinate: MapLatLng, delta: number = mapRegionDeltas.place) => {
      focusRegion(toRegion(coordinate, delta));
    },
    [focusRegion],
  );

  const resetOverview = useCallback(() => {
    focusRegion(baliRegion);
  }, [focusRegion]);

  const focusRoute = useCallback(() => {
    if (routeCoordinates.length < 2) return false;
    mapRef.current?.fitToCoordinates([...routeCoordinates], {
      edgePadding: routeEdgePadding,
      animated: true,
    });
    return true;
  }, [mapRef, routeCoordinates]);

  const routeKey = fitRoute
    ? `${viewportRevision}:${routeCoordinates
        .map(({ latitude, longitude }) => `${latitude}:${longitude}`)
        .join('|')}`
    : '';
  const resolvedFocusKey = focusKey
    ? `${viewportRevision}:${focusKey}`
    : undefined;

  useEffect(() => {
    if (!focusCoordinate || !resolvedFocusKey || fitRoute) {
      lastFocusKey.current = undefined;
      return;
    }
    if (!isMapReady || lastFocusKey.current === resolvedFocusKey) return;
    lastFocusKey.current = resolvedFocusKey;
    focusPlace(focusCoordinate);
  }, [fitRoute, focusCoordinate, focusPlace, isMapReady, resolvedFocusKey]);

  useEffect(() => {
    if (!fitRoute || !routeKey) {
      lastRouteKey.current = undefined;
      return;
    }
    if (!isMapReady || routeKey === lastRouteKey.current) return;
    lastRouteKey.current = routeKey;
    focusRoute();
  }, [fitRoute, focusRoute, isMapReady, routeKey]);

  useEffect(() => {
    if (
      !isMapReady ||
      recenterSignal <= 0 ||
      recenterSignal === lastRecenterSignal.current
    ) {
      return;
    }
    lastRecenterSignal.current = recenterSignal;

    if (fitRoute && focusRoute()) return;
    if (recenterTarget) {
      focusPlace(recenterTarget, mapRegionDeltas.neighborhood);
      return;
    }
    if (focusCoordinate) {
      focusPlace(focusCoordinate);
      return;
    }
    resetOverview();
  }, [
    fitRoute,
    focusCoordinate,
    focusPlace,
    focusRoute,
    isMapReady,
    recenterSignal,
    recenterTarget,
    resetOverview,
  ]);

  return { focusPlace, focusRegion, focusRoute, resetOverview };
}
