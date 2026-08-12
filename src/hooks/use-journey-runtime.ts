import * as Location from 'expo-location';
import { useEffect, useMemo, useRef, useState } from 'react';

import { journeyRuntime } from '@/constants/journey';
import type { Itinerary, ItineraryStop } from '@/types/itinerary';
import type { MapLatLng } from '@/types/map';
import { distanceMeters } from '@/utils/geo';

export type JourneyRuntimeState = {
  isActive: boolean;
  /** Stop the traveller is currently heading to. */
  currentStop?: ItineraryStop;
  remainingStops: readonly ItineraryStop[];
  /** Live position while the journey runs, otherwise null. */
  trackedLocation: MapLatLng | null;
  distanceToStopMeters: number | null;
  hasArrived: boolean;
  /**
   * Position rounded to the refresh threshold. Using it as the route origin
   * means a new route is requested only after meaningful movement, not on every
   * GPS tick.
   */
  routeAnchor: MapLatLng | null;
};

function roundToThreshold(value: number, meters: number): number {
  // Degrees per meter at the equator; precise enough to gate route refreshes.
  const step = meters / 111_320;
  return Math.round(value / step) * step;
}

/**
 * Derives the journey state from the itinerary plus live location. It owns no
 * itinerary data: the plan stays entirely in `ItineraryProvider`, and this hook
 * only reads it.
 *
 * The location watcher exists only while a journey is active and is removed as
 * soon as it stops, so the map never keeps a high-frequency watcher alive just
 * because it is mounted.
 */
export function useJourneyRuntime(
  itinerary: Itinerary | null,
): JourneyRuntimeState {
  const isActive = itinerary?.status === 'active';
  const [trackedLocation, setTrackedLocation] = useState<MapLatLng | null>(null);

  const remainingStops = useMemo(
    () =>
      itinerary?.approvedPlan?.stops.filter(
        (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
      ) ?? [],
    [itinerary],
  );
  const currentStop = remainingStops[0];
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    const watch = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        // The journey never prompts on its own; recentering asks for permission.
        if (!permission.granted || cancelled) return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: journeyRuntime.watch.accuracy,
            timeInterval: journeyRuntime.watch.timeIntervalMs,
            distanceInterval: journeyRuntime.watch.distanceIntervalMeters,
          },
          (position) => {
            if (cancelled || !isMountedRef.current) return;
            const next = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            // The watcher also fires on its time interval, so a stationary
            // traveller would otherwise re-render the whole map screen every
            // few seconds. Only real movement updates state.
            setTrackedLocation((current) =>
              current &&
              distanceMeters(current, next) <
                journeyRuntime.minimumMovementMeters
                ? current
                : next,
            );
          },
        );
        if (cancelled) {
          subscription.remove();
          subscription = null;
        }
      } catch {
        // Journey stays usable without live tracking.
      }
    };

    void watch();

    return () => {
      cancelled = true;
      subscription?.remove();
      subscription = null;
      setTrackedLocation(null);
    };
  }, [isActive]);

  const distanceToStopMeters =
    trackedLocation && currentStop
      ? distanceMeters(trackedLocation, currentStop.place)
      : null;

  const routeAnchor = useMemo(
    () =>
      trackedLocation
        ? {
            latitude: roundToThreshold(
              trackedLocation.latitude,
              journeyRuntime.routeRefreshDistanceMeters,
            ),
            longitude: roundToThreshold(
              trackedLocation.longitude,
              journeyRuntime.routeRefreshDistanceMeters,
            ),
          }
        : null,
    [trackedLocation],
  );

  return {
    isActive,
    currentStop,
    remainingStops,
    trackedLocation,
    distanceToStopMeters,
    hasArrived:
      distanceToStopMeters !== null &&
      distanceToStopMeters <= journeyRuntime.arrivalRadiusMeters,
    routeAnchor,
  };
}
