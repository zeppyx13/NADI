import { googleRoutesConfig, trafficGeometryConfig } from '@/constants/map';
import {
  parseProtobufDurationSeconds,
  readGoogleErrorDetails,
  readGoogleRoutes,
  type GoogleRoute,
} from '@/types/google-routes';
import type { MapLatLng } from '@/types/map';
import type {
  RouteCandidate,
  RouteEndpoint,
  RouteProviderStatus,
} from '@/types/route';
import { decodePolyline } from '@/utils/polyline';

const REQUEST_TIMEOUT_MS = 10_000;

type ProviderFailure = {
  status: Exclude<RouteProviderStatus, 'ready'>;
  httpStatus?: number;
  errorStatus?: string;
  errorReason?: string;
};

type ProviderSuccess = {
  status: 'ready';
  routes: readonly GoogleRoute[];
  httpStatus: number;
};

type ProviderResponse = ProviderSuccess | ProviderFailure;

export type GoogleRouteOutcome = {
  status: RouteProviderStatus;
  candidates: readonly RouteCandidate[];
  httpStatus?: number;
  errorStatus?: string;
  errorReason?: string;
};

export type GoogleRoadGeometryOutcome = {
  status: RouteProviderStatus;
  geometry: readonly MapLatLng[];
  httpStatus?: number;
  errorStatus?: string;
  errorReason?: string;
};

export function isGoogleRoutesEnabled(): boolean {
  return googleRoutesConfig.isEnabled;
}

function toWaypoint(point: MapLatLng) {
  return {
    location: {
      latLng: {
        latitude: point.latitude,
        longitude: point.longitude,
      },
    },
  };
}

/**
 * Single HTTP entry point to Google Routes v2. Both the traveller's route and
 * the traffic-corridor geometry go through here, so there is only ever one
 * Google client, one timeout policy, and one error classification.
 */
async function postComputeRoutes(
  body: Record<string, unknown>,
  fieldMask: string,
  signal?: AbortSignal,
): Promise<ProviderResponse> {
  const apiKey = googleRoutesConfig.apiKey;
  if (!apiKey) return { status: 'no-key' };
  if (signal?.aborted) return { status: 'aborted' };

  const requestController = new AbortController();
  const handleExternalAbort = () => requestController.abort();
  signal?.addEventListener('abort', handleExternalAbort, { once: true });
  const timeout = setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(googleRoutesConfig.computeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
      signal: requestController.signal,
    });

    if (!response.ok) {
      // Only the error classification is read; the raw body is never surfaced.
      const errorPayload: unknown = await response.json().catch(() => null);
      const details = readGoogleErrorDetails(errorPayload);
      return {
        status: 'http-error',
        httpStatus: response.status,
        errorStatus: details.status,
        errorReason: details.reason,
      };
    }

    const payload: unknown = await response.json();
    return {
      status: 'ready',
      routes: readGoogleRoutes(payload),
      httpStatus: response.status,
    };
  } catch {
    return signal?.aborted
      ? { status: 'aborted' }
      : { status: 'network-error' };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', handleExternalAbort);
  }
}

/**
 * Adapts one Google route into a NADI candidate. The decoded polyline is kept
 * whole: nothing here reduces the geometry to origin and destination.
 */
function toCandidate(route: GoogleRoute, index: number): RouteCandidate | null {
  const geometry = decodePolyline(route.polyline.encodedPolyline);
  if (geometry.length < 2) return null;

  const trafficAwareSeconds = parseProtobufDurationSeconds(route.duration);
  const staticSeconds = parseProtobufDurationSeconds(route.staticDuration);
  if (trafficAwareSeconds === null) return null;

  return {
    id: `google-route-${index}`,
    provider: 'google',
    geometry,
    distanceMeters: route.distanceMeters ?? 0,
    durationSeconds: trafficAwareSeconds,
    staticDurationSeconds: staticSeconds ?? undefined,
    // TRAFFIC_AWARE was requested, so a differing static duration proves it applied.
    isTrafficAware: staticSeconds !== null && staticSeconds !== trafficAwareSeconds,
    providerLabel: route.routeLabels?.[0],
  };
}

/**
 * Traveller-facing routing: traffic-aware, with alternatives so the three NADI
 * modes have something to choose between.
 */
export async function computeGoogleRoutes(
  origin: RouteEndpoint,
  destination: RouteEndpoint,
  signal?: AbortSignal,
): Promise<GoogleRouteOutcome> {
  const response = await postComputeRoutes(
    {
      origin: toWaypoint(origin),
      destination: toWaypoint(destination),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: true,
      units: 'METRIC',
      polylineQuality: googleRoutesConfig.polylineQuality,
    },
    googleRoutesConfig.fieldMask,
    signal,
  );

  if (response.status !== 'ready') {
    return {
      status: response.status,
      candidates: [],
      httpStatus: response.httpStatus,
      errorStatus: response.errorStatus,
      errorReason: response.errorReason,
    };
  }

  const candidates = response.routes
    .slice(0, googleRoutesConfig.maxAlternatives)
    .map(toCandidate)
    .filter((candidate): candidate is RouteCandidate => candidate !== null);

  if (candidates.length === 0) {
    return { status: 'empty', candidates: [], httpStatus: response.httpStatus };
  }

  return { status: 'ready', candidates, httpStatus: response.httpStatus };
}

/**
 * Geometry-only lookup that snaps a coarse corridor onto real roads.
 *
 * The first and last anchors act as origin and destination; the anchors in
 * between become intermediates so Google follows the intended corridor instead
 * of picking another road with the same endpoints. Waypoint order is preserved
 * and never optimised — these anchors are geometry guidance, not stops.
 */
export async function computeGoogleRoadGeometry(
  anchors: readonly MapLatLng[],
  signal?: AbortSignal,
): Promise<GoogleRoadGeometryOutcome> {
  if (anchors.length < 2) {
    return { status: 'empty', geometry: [] };
  }

  const intermediates = anchors
    .slice(1, -1)
    .slice(0, trafficGeometryConfig.maxIntermediates)
    .map(toWaypoint);

  const response = await postComputeRoutes(
    {
      origin: toWaypoint(anchors[0]),
      destination: toWaypoint(anchors[anchors.length - 1]),
      travelMode: 'DRIVE',
      routingPreference: trafficGeometryConfig.routingPreference,
      computeAlternativeRoutes: false,
      units: 'METRIC',
      polylineQuality: googleRoutesConfig.polylineQuality,
      ...(intermediates.length > 0 ? { intermediates } : {}),
    },
    trafficGeometryConfig.fieldMask,
    signal,
  );

  if (response.status !== 'ready') {
    return {
      status: response.status,
      geometry: [],
      httpStatus: response.httpStatus,
      errorStatus: response.errorStatus,
      errorReason: response.errorReason,
    };
  }

  const encoded = response.routes[0]?.polyline.encodedPolyline;
  if (!encoded) {
    return { status: 'empty', geometry: [], httpStatus: response.httpStatus };
  }

  const geometry = decodePolyline(encoded);
  if (geometry.length < 2) {
    return { status: 'empty', geometry: [], httpStatus: response.httpStatus };
  }

  return { status: 'ready', geometry, httpStatus: response.httpStatus };
}
