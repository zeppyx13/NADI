import type { CameraRef, LngLatBounds } from '@maplibre/maplibre-react-native';
import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';

import { baliMapCenter, baliMapZoom } from '@/constants/map';
import { motion } from '@/constants/theme';
import type { MapCoordinate } from '@/types/map';

type UseMapCameraOptions = {
  cameraRef: RefObject<CameraRef | null>;
  isMapReady: boolean;
  recenterSignal: number;
  focusKey?: string;
  focusCoordinate?: MapCoordinate;
  routeCoordinates: readonly MapCoordinate[];
  fitRoute: boolean;
  viewportRevision: string;
};

function getCoordinateBounds(
  coordinates: readonly MapCoordinate[],
): LngLatBounds | null {
  if (coordinates.length < 2) return null;

  let west = coordinates[0][0];
  let east = coordinates[0][0];
  let south = coordinates[0][1];
  let north = coordinates[0][1];

  coordinates.slice(1).forEach(([longitude, latitude]) => {
    west = Math.min(west, longitude);
    east = Math.max(east, longitude);
    south = Math.min(south, latitude);
    north = Math.max(north, latitude);
  });

  return [west, south, east, north];
}

export function useMapCamera({
  cameraRef,
  isMapReady,
  recenterSignal,
  focusKey,
  focusCoordinate,
  routeCoordinates,
  fitRoute,
  viewportRevision,
}: UseMapCameraOptions) {
  const lastFocusKey = useRef<string | undefined>(undefined);
  const lastRouteKey = useRef<string | undefined>(undefined);
  const lastRecenterSignal = useRef(0);
  const routeBounds = useMemo(
    () => getCoordinateBounds(routeCoordinates),
    [routeCoordinates],
  );
  const routeKey = useMemo(
    () =>
      fitRoute
        ? `${viewportRevision}:${routeCoordinates
            .map(([longitude, latitude]) => `${longitude}:${latitude}`)
            .join('|')}`
        : '',
    [fitRoute, routeCoordinates, viewportRevision],
  );
  const resolvedFocusKey = focusKey
    ? `${viewportRevision}:${focusKey}`
    : undefined;

  const focusRoute = useCallback(() => {
    if (!routeBounds) return false;
    cameraRef.current?.fitBounds(routeBounds, {
      duration: motion.routeTransition,
      easing: 'ease',
    });
    return true;
  }, [cameraRef, routeBounds]);

  useEffect(() => {
    if (!focusCoordinate || !resolvedFocusKey || fitRoute) {
      lastFocusKey.current = undefined;
      return;
    }
    if (!isMapReady || lastFocusKey.current === resolvedFocusKey) return;
    lastFocusKey.current = resolvedFocusKey;

    cameraRef.current?.easeTo({
      center: focusCoordinate,
      zoom: 10.5,
      duration: motion.slow,
      easing: 'ease',
    });
  }, [cameraRef, fitRoute, focusCoordinate, isMapReady, resolvedFocusKey]);

  useEffect(() => {
    if (!fitRoute || !routeKey) {
      lastRouteKey.current = undefined;
      return;
    }
    if (!isMapReady || routeKey === lastRouteKey.current) {
      return;
    }
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
    cameraRef.current?.easeTo({
      center: focusCoordinate ?? [...baliMapCenter],
      zoom: focusCoordinate ? 10.5 : baliMapZoom,
      duration: motion.slow,
      easing: 'ease',
    });
  }, [
    cameraRef,
    fitRoute,
    focusCoordinate,
    focusRoute,
    isMapReady,
    recenterSignal,
  ]);

  const focusCluster = useCallback(
    (coordinate: MapCoordinate, zoom: number) => {
      cameraRef.current?.easeTo({
        center: coordinate,
        zoom,
        duration: motion.slow,
        easing: 'ease',
      });
    },
    [cameraRef],
  );

  return { focusCluster };
}
