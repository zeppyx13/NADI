import { trafficGeometryConfig } from '@/constants/map';
import {
  computeGoogleRoadGeometry,
  isGoogleRoutesEnabled,
} from '@/services/google-routes-service';
import type { MapLatLng } from '@/types/map';
import type { TrafficSegment } from '@/types/map-intelligence';
import type { RouteProviderStatus } from '@/types/route';

/**
 * Snaps the coarse traffic corridors onto real roads.
 *
 * This is not a second routing engine: it owns no HTTP client and no polyline
 * decoder, and it only ever turns a segment's anchors into resolved geometry.
 * The traffic condition itself is never touched — road shape comes from the
 * provider, `smooth` / `moderate` / `heavy` / `blocked` stays local NADI data.
 */

type ResolvedGeometry = {
  path: readonly MapLatLng[];
  source: NonNullable<TrafficSegment['geometrySource']>;
  providerStatus: RouteProviderStatus;
  httpStatus?: number;
  errorStatus?: string;
  errorReason?: string;
};

/** Resolved per cache key for the lifetime of the app session. */
const geometryCache = new Map<string, ResolvedGeometry>();
/** Requests currently in flight, so the same segment is never asked twice. */
const inFlight = new Map<string, Promise<ResolvedGeometry>>();

/** Stable across renders; changes only when the authored anchors change. */
function buildCacheKey(segment: TrafficSegment): string {
  const anchors = segment.anchorPath ?? segment.path;
  const fingerprint = anchors
    .map(({ latitude, longitude }) => `${latitude.toFixed(5)},${longitude.toFixed(5)}`)
    .join('|');
  return `${segment.id}:${fingerprint}`;
}

function logDiagnostics(
  segment: TrafficSegment,
  anchorCount: number,
  resolved: ResolvedGeometry,
): void {
  if (!__DEV__) return;

  const summary = {
    segmentId: segment.id,
    provider: resolved.source,
    googleStatus: resolved.providerStatus,
    httpStatus: resolved.httpStatus,
    reason: resolved.errorReason ?? resolved.errorStatus,
    anchors: anchorCount,
    geometryPoints: resolved.path.length,
    fallbackUsed: resolved.source === 'local-anchor-fallback',
  };

  if (resolved.source === 'google-routes') {
    console.log('[NADI Traffic Geometry]', summary);
    return;
  }
  console.warn('[NADI Traffic Geometry]', summary);
}

async function resolveSegment(
  segment: TrafficSegment,
  signal?: AbortSignal,
): Promise<ResolvedGeometry> {
  const anchors = segment.anchorPath ?? segment.path;
  const fallback: ResolvedGeometry = {
    path: anchors,
    source: 'local-anchor-fallback',
    providerStatus: isGoogleRoutesEnabled() ? 'empty' : 'no-key',
  };

  if (!isGoogleRoutesEnabled() || anchors.length < 2) {
    return fallback;
  }

  const outcome = await computeGoogleRoadGeometry(anchors, signal);
  if (outcome.status !== 'ready' || outcome.geometry.length < 2) {
    return {
      ...fallback,
      providerStatus: outcome.status,
      httpStatus: outcome.httpStatus,
      errorStatus: outcome.errorStatus,
      errorReason: outcome.errorReason,
    };
  }

  return {
    path: outcome.geometry,
    source: 'google-routes',
    providerStatus: outcome.status,
    httpStatus: outcome.httpStatus,
  };
}

function resolveOnce(
  segment: TrafficSegment,
  signal?: AbortSignal,
): Promise<ResolvedGeometry> {
  const cacheKey = buildCacheKey(segment);

  const cached = geometryCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const anchorCount = (segment.anchorPath ?? segment.path).length;
  const request = resolveSegment(segment, signal)
    .then((resolved) => {
      // A fallback is never cached: a later attempt may still succeed.
      if (resolved.source === 'google-routes') {
        geometryCache.set(cacheKey, resolved);
      }
      logDiagnostics(segment, anchorCount, resolved);
      return resolved;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, request);
  return request;
}

function applyResolved(
  segment: TrafficSegment,
  resolved: ResolvedGeometry,
): TrafficSegment {
  return {
    ...segment,
    // Condition and dataSource are untouched on purpose.
    path: resolved.path,
    anchorPath: segment.anchorPath ?? segment.path,
    geometrySource: resolved.source,
  };
}

/** Geometry already resolved this session, without triggering any request. */
export function readCachedRoadGeometry(segment: TrafficSegment): TrafficSegment {
  const cached = geometryCache.get(buildCacheKey(segment));
  if (!cached) {
    return {
      ...segment,
      anchorPath: segment.anchorPath ?? segment.path,
      geometrySource: segment.geometrySource,
    };
  }
  return applyResolved(segment, cached);
}

/**
 * Resolves every segment, running a few at a time. Repeat calls are free: a
 * cached segment resolves instantly and an in-flight one is shared, so a filter
 * toggle or a re-render never produces another request.
 */
export async function resolveTrafficRoadGeometry(
  segments: readonly TrafficSegment[],
  signal?: AbortSignal,
): Promise<readonly TrafficSegment[]> {
  const resolved: TrafficSegment[] = [];

  for (
    let index = 0;
    index < segments.length;
    index += trafficGeometryConfig.concurrency
  ) {
    if (signal?.aborted) break;
    const batch = segments.slice(
      index,
      index + trafficGeometryConfig.concurrency,
    );
    const batchResults = await Promise.all(
      batch.map((segment) =>
        resolveOnce(segment, signal).then((geometry) =>
          applyResolved(segment, geometry),
        ),
      ),
    );
    resolved.push(...batchResults);
  }

  // An aborted run still returns usable shapes for whatever is left.
  segments.slice(resolved.length).forEach((segment) => {
    resolved.push(readCachedRoadGeometry(segment));
  });

  return resolved;
}
