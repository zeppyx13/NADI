import { googleRoutesConfig } from '@/constants/map';
import {
  parseProtobufDurationSeconds,
  readGoogleErrorDetails,
  readGoogleRoutes,
  type GoogleRoute,
} from '@/types/google-routes';
import type {
  RouteCandidate,
  RouteEndpoint,
  RouteProviderStatus,
} from '@/types/route';
import { decodePolyline } from '@/utils/polyline';

const REQUEST_TIMEOUT_MS = 10_000;

export type GoogleRouteOutcome = {
  status: RouteProviderStatus;
  candidates: readonly RouteCandidate[];
  httpStatus?: number;
  errorStatus?: string;
  errorReason?: string;
};

export function isGoogleRoutesEnabled(): boolean {
  return googleRoutesConfig.isEnabled;
}

function toWaypoint(endpoint: RouteEndpoint) {
  return {
    location: {
      latLng: {
        latitude: endpoint.latitude,
        longitude: endpoint.longitude,
      },
    },
  };
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
 * Calls Google Routes API v2 `computeRoutes` and adapts the response into NADI
 * route candidates.
 *
 * The outcome always explains itself. A failing provider used to be reported as
 * a bare error, which made a key restriction indistinguishable from a network
 * blip once the local fallback kicked in.
 */
export async function computeGoogleRoutes(
  origin: RouteEndpoint,
  destination: RouteEndpoint,
  signal?: AbortSignal,
): Promise<GoogleRouteOutcome> {
  const apiKey = googleRoutesConfig.apiKey;
  if (!apiKey) return { status: 'no-key', candidates: [] };
  if (signal?.aborted) return { status: 'aborted', candidates: [] };

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
        'X-Goog-FieldMask': googleRoutesConfig.fieldMask,
      },
      body: JSON.stringify({
        origin: toWaypoint(origin),
        destination: toWaypoint(destination),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: true,
        units: 'METRIC',
        polylineQuality: googleRoutesConfig.polylineQuality,
      }),
      signal: requestController.signal,
    });

    if (!response.ok) {
      // Only the error classification is read; the raw body is never surfaced.
      const errorPayload: unknown = await response.json().catch(() => null);
      const details = readGoogleErrorDetails(errorPayload);
      return {
        status: 'http-error',
        candidates: [],
        httpStatus: response.status,
        errorStatus: details.status,
        errorReason: details.reason,
      };
    }

    const payload: unknown = await response.json();
    const candidates = readGoogleRoutes(payload)
      .slice(0, googleRoutesConfig.maxAlternatives)
      .map(toCandidate)
      .filter((candidate): candidate is RouteCandidate => candidate !== null);

    if (candidates.length === 0) {
      return { status: 'empty', candidates: [], httpStatus: response.status };
    }

    return { status: 'ready', candidates, httpStatus: response.status };
  } catch {
    return signal?.aborted
      ? { status: 'aborted', candidates: [] }
      : { status: 'network-error', candidates: [] };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', handleExternalAbort);
  }
}
