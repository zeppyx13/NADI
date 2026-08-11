import type { RouteRisk, TrafficLevel } from '@/types/itinerary';

/**
 * Central weights and thresholds for NADI route scoring. Nothing here is
 * hardcoded inside a screen or a panel.
 *
 * The safety inputs come from the local deterministic datasets introduced in
 * Phase 2, so the scores are prototype intelligence rather than a trained model.
 */
export const routeScoringWeights = {
  fastest: {
    duration: 1,
  },
  balanced: {
    duration: 0.5,
    safety: 0.35,
    traffic: 0.15,
  },
} as const;

/** How close a route has to pass before a zone or incident counts against it. */
export const routeProximityMeters = {
  incident: 400,
  trafficSegment: 250,
} as const;

/** Penalty per matched item, on the 0–1 safety scale. */
export const routeSafetyPenalties = {
  safetyZone: {
    low: 0,
    medium: 0.12,
    high: 0.26,
  } satisfies Record<RouteRisk, number>,
  incidentSeverity: {
    info: 0.04,
    warning: 0.12,
    danger: 0.24,
  },
  closedRoad: 0.4,
} as const;

/** Penalty per matched traffic segment, on the 0–1 traffic scale. */
export const routeTrafficPenalties = {
  smooth: 0,
  moderate: 0.15,
  heavy: 0.35,
  blocked: 0.6,
} satisfies Record<TrafficLevel, number>;

/** Safety score boundaries that turn a number into a user-facing risk label. */
export const routeRiskThresholds = {
  low: 0.78,
  medium: 0.5,
} as const;

/** Traffic levels ordered from best to worst for "worst condition" lookups. */
export const trafficLevelSeverity = {
  smooth: 0,
  moderate: 1,
  heavy: 2,
  blocked: 3,
} satisfies Record<TrafficLevel, number>;
