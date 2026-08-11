import {
  incidentRepository,
  safetyRepository,
  trafficRepository,
} from '@/services/map-intelligence-repository';
import {
  computeGoogleRoutes,
  isGoogleRoutesEnabled,
} from '@/services/google-routes-service';
import {
  scoreRoutes,
  selectRoutesByMode,
  type RouteScoringInputs,
} from '@/services/route-scoring-service';
import type { MapLatLng } from '@/types/map';
import type {
  RouteCandidate,
  RouteDiagnostics,
  RouteEndpoint,
  RouteRequest,
  RouteResult,
  RouteResultStatus,
} from '@/types/route';
import { distanceMeters } from '@/utils/geo';

export interface RouteService {
  computeRoutes(request: RouteRequest, signal?: AbortSignal): Promise<RouteResult>;
}

/** Average driving speed used only by the offline fallback. */
const FALLBACK_SPEED_METERS_PER_SECOND = 8.5;

function interpolate(
  origin: MapLatLng,
  destination: MapLatLng,
  ratio: number,
  lateralOffset: number,
): MapLatLng {
  return {
    latitude:
      origin.latitude + (destination.latitude - origin.latitude) * ratio,
    longitude:
      origin.longitude +
      (destination.longitude - origin.longitude) * ratio +
      lateralOffset,
  };
}

/**
 * Deterministic geometry used when Google Routes is unavailable. It is clearly
 * marked `nadi-local` so nothing downstream mistakes it for provider data.
 */
function buildLocalCandidates(
  origin: RouteEndpoint,
  destination: RouteEndpoint,
): readonly RouteCandidate[] {
  const straightLineMeters = distanceMeters(origin, destination);
  // Road distance always exceeds the straight line; a fixed factor keeps it stable.
  const directDistance = straightLineMeters * 1.28;
  const detourDistance = straightLineMeters * 1.46;
  const spread = Math.max(
    0.012,
    Math.abs(destination.longitude - origin.longitude) * 0.18,
  );

  const buildGeometry = (offset: number): MapLatLng[] => [
    { latitude: origin.latitude, longitude: origin.longitude },
    interpolate(origin, destination, 0.33, offset),
    interpolate(origin, destination, 0.67, offset),
    { latitude: destination.latitude, longitude: destination.longitude },
  ];

  return [
    {
      id: 'nadi-local-direct',
      provider: 'nadi-local',
      geometry: buildGeometry(0),
      distanceMeters: Math.round(directDistance),
      durationSeconds: Math.round(directDistance / FALLBACK_SPEED_METERS_PER_SECOND),
      isTrafficAware: false,
    },
    {
      id: 'nadi-local-detour',
      provider: 'nadi-local',
      geometry: buildGeometry(spread),
      distanceMeters: Math.round(detourDistance),
      durationSeconds: Math.round(detourDistance / FALLBACK_SPEED_METERS_PER_SECOND),
      isTrafficAware: false,
    },
  ];
}

/**
 * Development-only visibility into which provider actually answered. Production
 * builds print nothing, and the API key value is never part of the output.
 */
function logDiagnostics(
  request: RouteRequest,
  status: RouteResultStatus,
  diagnostics: RouteDiagnostics,
): void {
  if (!__DEV__) return;

  const summary = {
    provider: status,
    googleStatus: diagnostics.providerStatus,
    hasApiKey: diagnostics.hasApiKey,
    httpStatus: diagnostics.httpStatus,
    errorStatus: diagnostics.errorStatus,
    reason: diagnostics.errorReason,
    candidates: diagnostics.parsedCandidateCount,
    geometryPoints: diagnostics.geometryPointCounts,
    fallbackUsed: diagnostics.fallbackUsed,
    origin: `${request.origin.name} (${request.origin.latitude.toFixed(5)}, ${request.origin.longitude.toFixed(5)})`,
    destination: `${request.destination.name} (${request.destination.latitude.toFixed(5)}, ${request.destination.longitude.toFixed(5)})`,
  };

  if (status === 'google') {
    console.log('[NADI Routes]', summary);
    return;
  }
  console.warn('[NADI Routes]', summary);
}

export class NadiRouteService implements RouteService {
  async computeRoutes(
    request: RouteRequest,
    signal?: AbortSignal,
  ): Promise<RouteResult> {
    // Scoring reads the same road-aligned geometry the map draws, so a route is
    // never judged against a coarse corridor that only looks like it crosses it.
    // The resolution is cached, so this costs nothing after the first pass.
    const [safetyZones, incidents, trafficSegments] = await Promise.all([
      safetyRepository.listZones(),
      incidentRepository.listActive(),
      trafficRepository.listSegmentsWithRoadGeometry(signal),
    ]);
    const inputs: RouteScoringInputs = {
      safetyZones,
      incidents,
      trafficSegments,
    };

    const hasApiKey = isGoogleRoutesEnabled();
    let candidates: readonly RouteCandidate[] = [];
    let status: RouteResultStatus = 'local-fallback';
    const diagnostics: RouteDiagnostics = {
      providerStatus: hasApiKey ? 'ready' : 'no-key',
      hasApiKey,
      parsedCandidateCount: 0,
      geometryPointCounts: [],
      fallbackUsed: false,
    };

    if (hasApiKey) {
      const outcome = await computeGoogleRoutes(
        request.origin,
        request.destination,
        signal,
      );
      diagnostics.providerStatus = outcome.status;
      diagnostics.httpStatus = outcome.httpStatus;
      diagnostics.errorStatus = outcome.errorStatus;
      diagnostics.errorReason = outcome.errorReason;
      diagnostics.parsedCandidateCount = outcome.candidates.length;
      diagnostics.geometryPointCounts = outcome.candidates.map(
        (candidate) => candidate.geometry.length,
      );

      if (outcome.status === 'ready' && outcome.candidates.length > 0) {
        candidates = outcome.candidates;
        status = 'google';
      }
    }

    if (candidates.length === 0) {
      candidates = buildLocalCandidates(request.origin, request.destination);
      diagnostics.fallbackUsed = true;
    }

    const routes = scoreRoutes(candidates, inputs);
    const selectionByMode = selectRoutesByMode(routes);

    if (!selectionByMode) {
      const unavailable: RouteResult = {
        origin: request.origin,
        destination: request.destination,
        routes: [],
        selectionByMode: { fastest: '', safest: '', balanced: '' },
        status: 'unavailable',
        diagnostics,
      };
      logDiagnostics(request, 'unavailable', diagnostics);
      return unavailable;
    }

    logDiagnostics(request, status, diagnostics);

    return {
      origin: request.origin,
      destination: request.destination,
      routes,
      selectionByMode,
      status,
      diagnostics,
    };
  }
}

export const routeService: RouteService = new NadiRouteService();
