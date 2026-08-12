/**
 * Minimal shape of a Google Routes API v2 `computeRoutes` response, limited to
 * the fields requested through the field mask.
 */
export type GoogleRoute = {
  /** Omitted by the API when the value would be zero. */
  distanceMeters?: number;
  /**
   * Protobuf duration string such as `"1234s"`. Absent on geometry-only
   * requests whose field mask asks for the polyline alone.
   */
  duration?: string;
  staticDuration?: string;
  polyline: { encodedPolyline: string };
  routeLabels?: readonly string[];
  travelAdvisory?: { speedReadingIntervals?: readonly GoogleSpeedReadingInterval[] };
};

/**
 * One entry of `routes.travelAdvisory.speedReadingIntervals`. Google omits
 * `startPolylinePointIndex` when it is zero, and `endPolylinePointIndex` is
 * exclusive.
 */
export type GoogleSpeedReadingInterval = {
  startPolylinePointIndex?: number;
  endPolylinePointIndex: number;
  speed: string;
};

function isSpeedReadingInterval(
  value: unknown,
): value is GoogleSpeedReadingInterval {
  if (!isRecord(value)) return false;
  if (typeof value.endPolylinePointIndex !== 'number') return false;
  if (typeof value.speed !== 'string') return false;
  if (
    value.startPolylinePointIndex !== undefined &&
    typeof value.startPolylinePointIndex !== 'number'
  ) {
    return false;
  }
  return true;
}

export function readSpeedReadingIntervals(
  value: unknown,
): readonly GoogleSpeedReadingInterval[] {
  if (!isRecord(value)) return [];
  const advisory = value.travelAdvisory;
  if (!isRecord(advisory)) return [];
  if (!Array.isArray(advisory.speedReadingIntervals)) return [];
  return advisory.speedReadingIntervals.filter(isSpeedReadingInterval);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isGoogleRoute(value: unknown): value is GoogleRoute {
  if (!isRecord(value)) return false;
  // The encoded polyline is the only field every caller needs. Everything else
  // depends on the field mask, so a missing extra never discards a usable route.
  if (!isRecord(value.polyline)) return false;
  if (typeof value.polyline.encodedPolyline !== 'string') return false;
  if (value.polyline.encodedPolyline.length === 0) return false;
  if (value.duration !== undefined && typeof value.duration !== 'string') {
    return false;
  }
  if (
    value.distanceMeters !== undefined &&
    typeof value.distanceMeters !== 'number'
  ) {
    return false;
  }
  if (value.staticDuration !== undefined && typeof value.staticDuration !== 'string') {
    return false;
  }
  if (value.routeLabels !== undefined && !isStringArray(value.routeLabels)) {
    return false;
  }
  return true;
}

/**
 * Google error envelope: `{ error: { code, status, message, details: [...] } }`.
 * Only the classification fields are read. The message is deliberately ignored
 * so nothing from the raw response reaches a log.
 */
export function readGoogleErrorDetails(value: unknown): {
  status?: string;
  reason?: string;
} {
  if (!isRecord(value) || !isRecord(value.error)) return {};

  const status =
    typeof value.error.status === 'string' ? value.error.status : undefined;

  let reason: string | undefined;
  if (Array.isArray(value.error.details)) {
    for (const detail of value.error.details) {
      if (isRecord(detail) && typeof detail.reason === 'string') {
        reason = detail.reason;
        break;
      }
    }
  }

  return { status, reason };
}

export function readGoogleRoutes(value: unknown): readonly GoogleRoute[] {
  if (!isRecord(value)) return [];
  if (!Array.isArray(value.routes)) return [];
  return value.routes.filter(isGoogleRoute);
}

/** Converts a protobuf duration string (`"1234s"`) into seconds. */
export function parseProtobufDurationSeconds(value?: string): number | null {
  if (!value) return null;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(value.trim());
  if (!match) return null;
  const seconds = Number.parseFloat(match[1]);
  return Number.isFinite(seconds) ? Math.round(seconds) : null;
}
