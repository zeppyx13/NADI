import type { RouteMode } from '@/constants/theme';
import {
  routeProximityMeters,
  routeRiskThresholds,
  routeSafetyPenalties,
  routeScoringWeights,
  routeTrafficPenalties,
  trafficLevelSeverity,
} from '@/constants/route-scoring';
import type { RouteRisk, TrafficLevel } from '@/types/itinerary';
import type {
  MapIncident,
  SafetyZone,
  TrafficSegment,
} from '@/types/map-intelligence';
import type { RouteCandidate, RouteScore, ScoredRoute } from '@/types/route';
import {
  arePathsWithinMeters,
  distanceToPathMeters,
} from '@/utils/geo';

export type RouteScoringInputs = {
  safetyZones: readonly SafetyZone[];
  incidents: readonly MapIncident[];
  trafficSegments: readonly TrafficSegment[];
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toRouteRisk(safetyScore: number): RouteRisk {
  if (safetyScore >= routeRiskThresholds.low) return 'low';
  if (safetyScore >= routeRiskThresholds.medium) return 'medium';
  return 'high';
}

function worstTrafficLevel(levels: readonly TrafficLevel[]): TrafficLevel {
  return levels.reduce<TrafficLevel>(
    (worst, level) =>
      trafficLevelSeverity[level] > trafficLevelSeverity[worst] ? level : worst,
    'smooth',
  );
}

/**
 * Safety and traffic exposure of a route against the local intelligence data.
 * Google supplies the geometry; every judgement below is NADI's.
 */
function measureRoute(
  candidate: RouteCandidate,
  { safetyZones, incidents, trafficSegments }: RouteScoringInputs,
) {
  let safetyPenalty = 0;

  safetyZones.forEach((zone) => {
    const distance = distanceToPathMeters(zone, candidate.geometry);
    if (distance <= zone.radiusMeters) {
      safetyPenalty += routeSafetyPenalties.safetyZone[zone.risk];
    }
  });

  const nearbyIncidentIds: string[] = [];
  let crossesClosedRoad = false;

  incidents.forEach((incident) => {
    const isNear =
      distanceToPathMeters(incident, candidate.geometry) <=
        routeProximityMeters.incident ||
      (incident.affectedPath !== undefined &&
        arePathsWithinMeters(
          incident.affectedPath,
          candidate.geometry,
          routeProximityMeters.incident,
        ));
    if (!isNear) return;

    nearbyIncidentIds.push(incident.id);
    safetyPenalty += routeSafetyPenalties.incidentSeverity[incident.severity];
    if (incident.accessImpact === 'full-closure') {
      crossesClosedRoad = true;
      safetyPenalty += routeSafetyPenalties.closedRoad;
    }
  });

  let trafficPenalty = 0;
  const touchedLevels: TrafficLevel[] = [];

  trafficSegments.forEach((segment) => {
    // `segment.path` is the resolved road-aligned corridor, the same geometry
    // the traffic layer draws.
    if (
      !arePathsWithinMeters(
        segment.path,
        candidate.geometry,
        routeProximityMeters.trafficSegment,
      )
    ) {
      return;
    }
    touchedLevels.push(segment.condition);
    trafficPenalty += routeTrafficPenalties[segment.condition];
  });

  return {
    safetyScore: clamp01(1 - safetyPenalty),
    trafficScore: clamp01(1 - trafficPenalty),
    trafficLevel: worstTrafficLevel(touchedLevels),
    nearbyIncidentIds,
    crossesClosedRoad,
  };
}

/**
 * Scores every candidate on the same scale so the three modes can be compared.
 * `fastestScore` is relative to the quickest candidate in the set.
 */
export function scoreRoutes(
  candidates: readonly RouteCandidate[],
  inputs: RouteScoringInputs,
): readonly ScoredRoute[] {
  if (candidates.length === 0) return [];

  const quickestSeconds = candidates.reduce(
    (quickest, candidate) => Math.min(quickest, candidate.durationSeconds),
    Number.POSITIVE_INFINITY,
  );

  return candidates.map((candidate) => {
    const measured = measureRoute(candidate, inputs);
    const fastestScore =
      candidate.durationSeconds > 0
        ? clamp01(quickestSeconds / candidate.durationSeconds)
        : 0;
    const balancedScore = clamp01(
      fastestScore * routeScoringWeights.balanced.duration +
        measured.safetyScore * routeScoringWeights.balanced.safety +
        measured.trafficScore * routeScoringWeights.balanced.traffic,
    );

    const score: RouteScore = {
      routeId: candidate.id,
      fastestScore,
      safetyScore: measured.safetyScore,
      balancedScore,
      routeRisk: toRouteRisk(measured.safetyScore),
      trafficLevel: measured.trafficLevel,
      nearbyIncidentIds: measured.nearbyIncidentIds,
      crossesClosedRoad: measured.crossesClosedRoad,
    };

    return { candidate, score };
  });
}

function pickBest(
  routes: readonly ScoredRoute[],
  read: (route: ScoredRoute) => number,
): string {
  return routes.reduce((best, route) =>
    read(route) > read(best) ? route : best,
  ).candidate.id;
}

/** Chooses the winning route id for each mode from an already scored set. */
export function selectRoutesByMode(
  routes: readonly ScoredRoute[],
): Record<RouteMode, string> | null {
  if (routes.length === 0) return null;
  return {
    fastest: pickBest(routes, (route) => route.score.fastestScore),
    safest: pickBest(routes, (route) => route.score.safetyScore),
    balanced: pickBest(routes, (route) => route.score.balancedScore),
  };
}
