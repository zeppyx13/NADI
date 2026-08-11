import type { AlertSeverity } from '@/types/travel-alert';
import type {
  ConditionDataSource,
  ParkingStatus,
  RouteRisk,
  TrafficLevel,
} from '@/types/itinerary';
import type { MapLatLng } from '@/types/map';

/**
 * Domain entities behind the NADI map intelligence layers.
 *
 * The schemas are shaped for a future backend: every entity carries a stable
 * id, a coordinate or geometry, a timestamp, and a `dataSource` marker. The
 * current values come from a local deterministic dataset.
 */

export type IntelligenceLayerId =
  | 'traffic'
  | 'monitoring'
  | 'incidents'
  | 'crowd'
  | 'safety'
  | 'parking';

// ---------------------------------------------------------------------------
// Monitoring points (CCTV / ATCS)
// ---------------------------------------------------------------------------

export type MonitoringPointType = 'cctv' | 'atcs';

export type MonitoringPointStatus = 'online' | 'offline' | 'limited';

/**
 * Monitoring media in this build is recorded footage, never a live stream.
 * `assetId` resolves through `src/data/monitoring-media.ts`; `uri` is used when
 * the recording is served from a remote location instead.
 */
export type RecordedMonitoringMedia = {
  type: 'recorded-video';
  assetId?: string;
  uri?: string;
  /** Wall-clock time the recording was captured. */
  recordedAt?: string;
  durationSeconds?: number;
};

export type MonitoringPoint = {
  id: string;
  type: MonitoringPointType;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  status: MonitoringPointStatus;
  trafficCondition?: TrafficLevel;
  recordedMedia?: RecordedMonitoringMedia;
  updatedAt: string;
  dataSource: ConditionDataSource;
};

// ---------------------------------------------------------------------------
// Road traffic
// ---------------------------------------------------------------------------

/** Where the drawn corridor shape came from. The condition never does. */
export type TrafficGeometrySource = 'google-routes' | 'local-anchor-fallback';

export type TrafficSegment = {
  id: string;
  /** Road or corridor name shown to the user. */
  name: string;
  area: string;
  condition: TrafficLevel;
  /**
   * Geometry of the road-condition overlay, road-aligned once the provider has
   * resolved it and equal to `anchorPath` until then. This is not a travel
   * route: the traveller's own line is `RouteCandidate.geometry`.
   */
  path: readonly MapLatLng[];
  /**
   * Coarse corridor anchors authored in `src/data/traffic-segments.ts`. They
   * stay available as the resolution input, the fallback shape, and the record
   * of which corridor the segment is meant to follow.
   */
  anchorPath?: readonly MapLatLng[];
  geometrySource?: TrafficGeometrySource;
  averageSpeedKph?: number;
  updatedAt: string;
  dataSource: ConditionDataSource;
};

// ---------------------------------------------------------------------------
// Incidents, closures and local events
// ---------------------------------------------------------------------------

export type MapIncidentType =
  | 'accident'
  | 'road-closure'
  | 'road-disruption'
  | 'heavy-congestion'
  | 'stopped-vehicle'
  | 'local-event';

/**
 * Verification is an operator responsibility. The mobile app only reads this
 * status; it never changes it.
 */
export type MapIncidentStatus = 'suspected' | 'verified' | 'resolved';

export type MapIncidentAccessImpact =
  | 'none'
  | 'slower'
  | 'partial-closure'
  | 'full-closure';

export type MapIncident = {
  id: string;
  type: MapIncidentType;
  status: MapIncidentStatus;
  severity: AlertSeverity;
  titleKey: string;
  descriptionKey: string;
  locationName: string;
  latitude: number;
  longitude: number;
  /** Optional stretch of road covered by the incident. */
  affectedPath?: readonly MapLatLng[];
  affectedAreaName?: string;
  accessImpact: MapIncidentAccessImpact;
  startedAt: string;
  endsAt?: string;
  /** Links back to the alert feed entry when the same event appears there. */
  alertId?: string;
  dataSource: ConditionDataSource;
};

// ---------------------------------------------------------------------------
// Destination crowd
// ---------------------------------------------------------------------------

export type DestinationCrowd = {
  destinationId: string;
  /** 0–1 share of the destination's comfortable capacity. */
  currentLoadRatio: number;
  predictedLoadRatio?: number;
  level: 'low' | 'moderate' | 'high' | 'critical';
  updatedAt: string;
  dataSource: ConditionDataSource;
};

// ---------------------------------------------------------------------------
// Safety zones
// ---------------------------------------------------------------------------

export type SafetyZone = {
  id: string;
  name: string;
  area: string;
  risk: RouteRisk;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  reasonKey: string;
  updatedAt: string;
  dataSource: ConditionDataSource;
};

// ---------------------------------------------------------------------------
// Parking
// ---------------------------------------------------------------------------

export type ParkingArea = {
  id: string;
  name: string;
  destinationId?: string;
  latitude: number;
  longitude: number;
  status: ParkingStatus;
  capacity?: number;
  availableSpaces?: number;
  updatedAt: string;
  dataSource: ConditionDataSource;
};
