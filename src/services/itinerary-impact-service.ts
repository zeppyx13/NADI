import { getAdaptiveScenario } from '@/data/adaptive-scenarios';
import { destinationScenarioConditions } from '@/data/itinerary-scenarios';
import { itineraryDecisionThresholds } from '@/data/itinerary-thresholds';
import {
  crowdRepository,
  incidentRepository,
  parkingRepository,
  safetyRepository,
  trafficRepository,
} from '@/services/map-intelligence-repository';
import { routeProximityMeters } from '@/constants/route-scoring';
import type { OccupancyLevel } from '@/constants/theme';
import type {
  DestinationConditionSnapshot,
  ItineraryScenarioId,
  ItineraryStop,
  ParkingStatus,
  RouteRisk,
  TrafficLevel,
} from '@/types/itinerary';
import type { MapIncident } from '@/types/map-intelligence';
import type { ScoredRoute } from '@/types/route';
import { arePathsWithinMeters, distanceToPathMeters } from '@/utils/geo';

/**
 * Turns the map intelligence repositories into the condition snapshots the
 * itinerary analysis reasons about.
 *
 * Before this service the analysis only knew `destinationScenarioConditions`,
 * a static per-destination table covering the five pilot destinations. Traffic,
 * incidents, safety zones, crowd and parking gathered in Phase 2, and the
 * road-aligned corridors from Phase 3.5, were never consulted. This is the
 * bridge, and it is the only place that joins the two sides.
 *
 * All readings remain local deterministic data.
 */

/** How far from a stop an incident or zone still counts as affecting it. */
const STOP_PROXIMITY_METERS = 1_500;

function ratioToOccupancyLevel(ratio: number): OccupancyLevel {
  if (ratio >= itineraryDecisionThresholds.occupancy.critical) return 'critical';
  if (ratio >= itineraryDecisionThresholds.occupancy.high) return 'high';
  if (ratio >= itineraryDecisionThresholds.occupancy.moderate) return 'moderate';
  return 'low';
}

/**
 * Only a verified event may drive a significant recommendation. A `suspected`
 * report is an operator's to confirm, and the mobile app never does that.
 */
function isActionableIncident(incident: MapIncident): boolean {
  return incident.status === 'verified';
}

const trafficSeverity: Record<TrafficLevel, number> = {
  smooth: 0,
  moderate: 1,
  heavy: 2,
  blocked: 3,
};

const riskSeverity: Record<RouteRisk, number> = { low: 0, medium: 1, high: 2 };

export type StopIntelligence = {
  stopId: string;
  destinationId: string;
  hasCoverage: boolean;
  currentLoadRatio?: number;
  predictedLoadRatio?: number;
  trafficLevel: TrafficLevel;
  routeRisk: RouteRisk;
  parkingStatus: ParkingStatus;
  roadClosed: boolean;
  activeIncidentIds: readonly string[];
  localEventId?: string;
  localEventAffectsAccess: boolean;
};

export type RouteImpact = {
  routeId: string;
  crossesClosedRoad: boolean;
  blockingIncidentIds: readonly string[];
  worstTrafficLevel: TrafficLevel;
  routeRisk: RouteRisk;
  /** True when nothing NADI knows about disturbs this candidate. */
  isClear: boolean;
};

export interface ItineraryImpactService {
  /** Condition of a stop and of the leg leading to it. */
  assessStop(
    stop: ItineraryStop,
    scenarioId: ItineraryScenarioId,
    isNextRemaining: boolean,
  ): Promise<StopIntelligence>;
  /** Evaluates route candidates against everything NADI knows. */
  assessRouteCandidates(
    routes: readonly ScoredRoute[],
  ): Promise<readonly RouteImpact[]>;
}

export class LocalItineraryImpactService implements ItineraryImpactService {
  async assessStop(
    stop: ItineraryStop,
    scenarioId: ItineraryScenarioId,
    isNextRemaining: boolean,
  ): Promise<StopIntelligence> {
    const [crowdEntries, parkingAreas, safetyZones, incidents, segments] =
      await Promise.all([
        crowdRepository.listDestinationCrowd(),
        parkingRepository.listAreas(),
        safetyRepository.listZones(),
        incidentRepository.listActive(),
        trafficRepository.listSegmentsWithRoadGeometry(),
      ]);

    const crowd = crowdEntries.find(
      (entry) => entry.destinationId === stop.destinationId,
    );
    const parking = parkingAreas.find(
      (area) => area.destinationId === stop.destinationId,
    );
    // The static pilot table still contributes what the repositories do not
    // model, such as the local event attached to a destination.
    const legacy = destinationScenarioConditions[stop.destinationId];

    let routeRisk: RouteRisk = legacy?.routeRisk ?? 'low';
    safetyZones.forEach((zone) => {
      if (distanceToPathMeters(zone, [stop.place]) > zone.radiusMeters) return;
      if (riskSeverity[zone.risk] > riskSeverity[routeRisk]) routeRisk = zone.risk;
    });

    let trafficLevel: TrafficLevel = legacy?.trafficLevel ?? 'smooth';
    segments.forEach((segment) => {
      if (
        !arePathsWithinMeters(
          segment.path,
          [stop.place],
          routeProximityMeters.trafficSegment,
        )
      ) {
        return;
      }
      if (trafficSeverity[segment.condition] > trafficSeverity[trafficLevel]) {
        trafficLevel = segment.condition;
      }
    });

    const nearbyIncidents = incidents.filter(
      (incident) =>
        isActionableIncident(incident) &&
        distanceToPathMeters(incident, [stop.place]) <= STOP_PROXIMITY_METERS,
    );
    let roadClosed = legacy?.roadClosed ?? false;
    nearbyIncidents.forEach((incident) => {
      if (incident.accessImpact === 'full-closure') roadClosed = true;
    });

    const intelligence: StopIntelligence = {
      stopId: stop.id,
      destinationId: stop.destinationId,
      hasCoverage: Boolean(crowd || parking || legacy),
      currentLoadRatio: crowd?.currentLoadRatio ?? legacy?.currentLoadRatio,
      predictedLoadRatio:
        crowd?.predictedLoadRatio ??
        crowd?.currentLoadRatio ??
        legacy?.basePredictedLoadRatio,
      trafficLevel,
      routeRisk,
      parkingStatus: parking?.status ?? legacy?.parkingStatus ?? 'unknown',
      roadClosed,
      activeIncidentIds: [
        ...new Set([
          ...(legacy?.activeIncidentIds ?? []),
          ...nearbyIncidents.map((incident) => incident.id),
        ]),
      ],
      localEventId: legacy?.localEventId,
      localEventAffectsAccess: nearbyIncidents.some(
        (incident) =>
          incident.type === 'local-event' && incident.accessImpact !== 'none',
      ),
    };

    return isNextRemaining
      ? applyScenario(intelligence, scenarioId)
      : intelligence;
  }

  async assessRouteCandidates(
    routes: readonly ScoredRoute[],
  ): Promise<readonly RouteImpact[]> {
    const incidents = await incidentRepository.listActive();

    return routes.map((route) => {
      const blocking = incidents.filter((incident) => {
        if (!isActionableIncident(incident)) return false;
        if (incident.accessImpact === 'none') return false;
        const nearPoint =
          distanceToPathMeters(incident, route.candidate.geometry) <=
          routeProximityMeters.incident;
        const nearPath =
          incident.affectedPath !== undefined &&
          arePathsWithinMeters(
            incident.affectedPath,
            route.candidate.geometry,
            routeProximityMeters.incident,
          );
        return nearPoint || nearPath;
      });

      const crossesClosedRoad = blocking.some(
        (incident) => incident.accessImpact === 'full-closure',
      );

      return {
        routeId: route.candidate.id,
        crossesClosedRoad,
        blockingIncidentIds: blocking.map((incident) => incident.id),
        worstTrafficLevel: route.score.trafficLevel,
        routeRisk: route.score.routeRisk,
        isClear:
          !crossesClosedRoad &&
          blocking.length === 0 &&
          route.score.routeRisk !== 'high' &&
          trafficSeverity[route.score.trafficLevel] < trafficSeverity.heavy,
      };
    });
  }
}

/** Applies the deterministic scenario override on top of the read conditions. */
function applyScenario(
  intelligence: StopIntelligence,
  scenarioId: ItineraryScenarioId,
): StopIntelligence {
  const { nextStopOverride } = getAdaptiveScenario(scenarioId);

  return {
    ...intelligence,
    trafficLevel: nextStopOverride.trafficLevel ?? intelligence.trafficLevel,
    routeRisk: nextStopOverride.routeRisk ?? intelligence.routeRisk,
    parkingStatus: nextStopOverride.parkingStatus ?? intelligence.parkingStatus,
    roadClosed: nextStopOverride.roadClosed ?? intelligence.roadClosed,
    predictedLoadRatio:
      nextStopOverride.predictedLoadRatio ?? intelligence.predictedLoadRatio,
    activeIncidentIds: nextStopOverride.activeIncidentIds
      ? [
          ...new Set([
            ...intelligence.activeIncidentIds,
            ...nextStopOverride.activeIncidentIds,
          ]),
        ]
      : intelligence.activeIncidentIds,
    localEventAffectsAccess:
      nextStopOverride.forceLocalEventImpact ??
      intelligence.localEventAffectsAccess,
  };
}

/** Shapes the intelligence into the snapshot the analysis service consumes. */
export function toConditionSnapshot(
  intelligence: StopIntelligence,
  plannedArrival: string,
  capturedAt: string,
): DestinationConditionSnapshot | null {
  if (!intelligence.hasCoverage) return null;
  const predictedLoadRatio =
    intelligence.predictedLoadRatio ?? intelligence.currentLoadRatio ?? 0;

  return {
    capturedAt,
    predictedArrivalAt: plannedArrival,
    occupancy: {
      currentLoadRatio: intelligence.currentLoadRatio ?? predictedLoadRatio,
      predictedLoadRatio,
      status: ratioToOccupancyLevel(predictedLoadRatio),
    },
    access: {
      trafficLevel: intelligence.trafficLevel,
      routeRisk: intelligence.routeRisk,
      activeIncidentIds: [...intelligence.activeIncidentIds],
      roadClosed: intelligence.roadClosed,
    },
    parking: { status: intelligence.parkingStatus },
    localContext: intelligence.localEventId
      ? {
          eventId: intelligence.localEventId,
          affectsAccess: intelligence.localEventAffectsAccess,
        }
      : undefined,
    dataSource: 'mock',
  };
}

export const itineraryImpactService: ItineraryImpactService =
  new LocalItineraryImpactService();
