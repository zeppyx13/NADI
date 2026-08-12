import type {
  ItineraryScenarioId,
  ParkingStatus,
  RouteRisk,
  TrafficLevel,
} from '@/types/itinerary';

/**
 * Deterministic overrides applied to the next remaining stop when a scenario is
 * active. The same scenario always produces the same condition, so a demo can be
 * replayed exactly. Nothing here uses randomness.
 *
 * Only the leg the traveller is about to drive is affected: a scenario describes
 * a situation ahead of them, not a change to the whole itinerary.
 */
export type AdaptiveScenarioOverride = {
  trafficLevel?: TrafficLevel;
  routeRisk?: RouteRisk;
  parkingStatus?: ParkingStatus;
  roadClosed?: boolean;
  /** Incident ids treated as active on the leg to the affected stop. */
  activeIncidentIds?: readonly string[];
  /** Overrides the predicted load ratio at arrival, 0–1. */
  predictedLoadRatio?: number;
  /** Marks the local event on the affected stop as access-restricting. */
  forceLocalEventImpact?: boolean;
};

export type AdaptiveScenario = {
  id: ItineraryScenarioId;
  /** Applied to the first remaining stop only. */
  nextStopOverride: AdaptiveScenarioOverride;
};

/**
 * Incidents referenced here exist in `src/data/map-incidents.ts` and carry a
 * `verified` status, because a significant recommendation is only raised from a
 * verified event.
 */
export const adaptiveScenarios: Record<ItineraryScenarioId, AdaptiveScenario> = {
  normal: {
    id: 'normal',
    nextStopOverride: {},
  },
  'destination-crowded': {
    id: 'destination-crowded',
    nextStopOverride: { predictedLoadRatio: 0.93 },
  },
  'route-congested': {
    id: 'route-congested',
    nextStopOverride: { trafficLevel: 'heavy' },
  },
  'route-incident': {
    id: 'route-incident',
    nextStopOverride: {
      trafficLevel: 'heavy',
      routeRisk: 'high',
      activeIncidentIds: ['incident-teuku-umar'],
    },
  },
  'road-closure': {
    id: 'road-closure',
    nextStopOverride: {
      roadClosed: true,
      trafficLevel: 'blocked',
      activeIncidentIds: ['incident-ubud-closure'],
    },
  },
  'parking-full': {
    id: 'parking-full',
    nextStopOverride: { parkingStatus: 'full' },
  },
  'high-risk-route': {
    id: 'high-risk-route',
    nextStopOverride: { routeRisk: 'high' },
  },
  'local-event-impact': {
    id: 'local-event-impact',
    nextStopOverride: {
      forceLocalEventImpact: true,
      trafficLevel: 'heavy',
      activeIncidentIds: ['event-ubud-ceremony'],
    },
  },
};

export function getAdaptiveScenario(id: ItineraryScenarioId): AdaptiveScenario {
  return adaptiveScenarios[id];
}
