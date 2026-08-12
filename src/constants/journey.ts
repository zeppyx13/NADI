import * as Location from 'expo-location';

/**
 * Journey runtime tuning. Nothing here is duplicated inside a component.
 */
export const journeyRuntime = {
  /** Within this distance the traveller counts as arrived at the stop. */
  arrivalRadiusMeters: 150,
  /**
   * Location updates while a journey is running. Explore mode does not watch at
   * all; the watcher only exists for the lifetime of the active journey.
   */
  watch: {
    accuracy: Location.Accuracy.Balanced,
    timeIntervalMs: 5_000,
    distanceIntervalMeters: 25,
  },
  /**
   * Minimum movement before the current leg is recomputed. Without it a route
   * request would fire on every GPS tick.
   */
  routeRefreshDistanceMeters: 250,
  /**
   * Minimum movement before the tracked position becomes new state. The watcher
   * also fires on a timer, so this stops a stationary traveller from
   * re-rendering the map screen every few seconds.
   */
  minimumMovementMeters: 20,
} as const;
