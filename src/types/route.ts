import type { RouteMode } from '@/constants/theme';
import type { RouteRisk, TrafficLevel } from '@/types/itinerary';
import type { MapLatLng } from '@/types/map';

/**
 * Where a route came from. Google geometry and NADI's local fallback are never
 * mixed without this marker.
 */
export type RouteProvider = 'google' | 'nadi-local';

export type RouteEndpoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type RouteRequest = {
  origin: RouteEndpoint;
  destination: RouteEndpoint;
};

/** Google's speed classes for a stretch of the route polyline. */
export type ProviderTrafficSeverity = 'normal' | 'slow' | 'jam';

/**
 * One stretch of the route polyline, expressed as vertex indices into
 * `RouteCandidate.geometry`. `endIndex` is exclusive, matching Google's
 * `endPolylinePointIndex`.
 */
export type ProviderTrafficInterval = {
  startIndex: number;
  endIndex: number;
  severity: ProviderTrafficSeverity;
};

/** Live traffic along the route, as reported by the provider. */
export type ProviderTrafficSummary = {
  intervals: readonly ProviderTrafficInterval[];
  /** Share of route vertices in each class, 0–1. */
  normalRatio: number;
  slowRatio: number;
  jamRatio: number;
  worst: ProviderTrafficSeverity;
};

/**
 * Provider-neutral route. Raw Google responses are adapted into this shape
 * before anything in the UI sees them.
 */
export type RouteCandidate = {
  id: string;
  provider: RouteProvider;
  /**
   * The traveller's own route. When `provider` is `google` these are the
   * decoded points of `routes.polyline.encodedPolyline` and they follow the
   * road. Not to be confused with `TrafficSegment.path`, which is the coarse
   * corridor geometry of the road-condition overlay.
   */
  geometry: readonly MapLatLng[];
  distanceMeters: number;
  /** Traffic-aware when `isTrafficAware` is true, otherwise the static duration. */
  durationSeconds: number;
  staticDurationSeconds?: number;
  isTrafficAware: boolean;
  /** Provider label such as Google's `DEFAULT_ROUTE`, kept for diagnostics. */
  providerLabel?: string;
  /** Present when the provider returned traffic along the polyline. */
  providerTraffic?: ProviderTrafficSummary;
};

/**
 * NADI scoring on top of the provider geometry. Google does not supply a
 * "safest route"; the safety and balanced numbers are computed here.
 */
export type RouteScore = {
  routeId: string;
  fastestScore: number;
  safetyScore: number;
  balancedScore: number;
  routeRisk: RouteRisk;
  /** Worst road condition NADI knows about along this route. */
  trafficLevel: TrafficLevel;
  /** Worst provider traffic class along this route, when reported. */
  providerTrafficSeverity?: ProviderTrafficSeverity;
  nearbyIncidentIds: readonly string[];
  crossesClosedRoad: boolean;
};

export type ScoredRoute = {
  candidate: RouteCandidate;
  score: RouteScore;
};

export type RouteResultStatus =
  | 'google'
  | 'local-fallback'
  | 'unavailable';

/** Why the provider did or did not answer. Never carries the API key. */
export type RouteProviderStatus =
  | 'ready'
  | 'no-key'
  | 'http-error'
  | 'network-error'
  /** The provider answered that no route exists between these points. */
  | 'empty'
  /** The provider returned routes, but none of them could be read. */
  | 'unparsable'
  | 'aborted';

export type RouteDiagnostics = {
  providerStatus: RouteProviderStatus;
  /** True only when a key is configured; the value itself is never exposed. */
  hasApiKey: boolean;
  httpStatus?: number;
  /** Google's `error.status`, for example `PERMISSION_DENIED`. */
  errorStatus?: string;
  /** Google's `error.details[].reason`, for example `API_KEY_SERVICE_BLOCKED`. */
  errorReason?: string;
  /** Candidates that survived parsing and polyline decoding. */
  parsedCandidateCount: number;
  /** Decoded point count per candidate, in order. */
  geometryPointCounts: readonly number[];
  fallbackUsed: boolean;
};

export type RouteResult = {
  origin: RouteEndpoint;
  destination: RouteEndpoint;
  routes: readonly ScoredRoute[];
  /** Route id chosen for each mode. */
  selectionByMode: Readonly<Record<RouteMode, string>>;
  status: RouteResultStatus;
  diagnostics: RouteDiagnostics;
};
