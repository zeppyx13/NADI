/**
 * Minimal shape of a Google Routes API v2 `computeRoutes` response, limited to
 * the fields requested through the field mask.
 */
export type GoogleRoute = {
  /** Omitted by the API when the value would be zero. */
  distanceMeters?: number;
  /** Protobuf duration string such as `"1234s"`. */
  duration: string;
  staticDuration?: string;
  polyline: { encodedPolyline: string };
  routeLabels?: readonly string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isGoogleRoute(value: unknown): value is GoogleRoute {
  if (!isRecord(value)) return false;
  // `duration` and the encoded polyline are the only fields a route cannot
  // work without. Everything else stays optional so one missing extra never
  // discards an otherwise usable route.
  if (typeof value.duration !== 'string') return false;
  if (!isRecord(value.polyline)) return false;
  if (typeof value.polyline.encodedPolyline !== 'string') return false;
  if (value.polyline.encodedPolyline.length === 0) return false;
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
