import type { MapLatLng } from '@/types/map';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/** Great-circle distance in meters. */
export function distanceMeters(from: MapLatLng, to: MapLatLng): number {
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.sin(deltaLng / 2) ** 2 * Math.cos(fromLat) * Math.cos(toLat);
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Shortest distance in meters from a point to any vertex of a path. */
export function distanceToPathMeters(
  point: MapLatLng,
  path: readonly MapLatLng[],
): number {
  if (path.length === 0) return Number.POSITIVE_INFINITY;
  return path.reduce(
    (closest, vertex) => Math.min(closest, distanceMeters(point, vertex)),
    Number.POSITIVE_INFINITY,
  );
}

/** True when any vertex of `path` falls within `radiusMeters` of `point`. */
export function isPathNearPoint(
  path: readonly MapLatLng[],
  point: MapLatLng,
  radiusMeters: number,
): boolean {
  return distanceToPathMeters(point, path) <= radiusMeters;
}

/** Shortest distance in meters between two paths, sampled vertex to vertex. */
export function distanceBetweenPathsMeters(
  first: readonly MapLatLng[],
  second: readonly MapLatLng[],
): number {
  if (first.length === 0 || second.length === 0) {
    return Number.POSITIVE_INFINITY;
  }
  return first.reduce(
    (closest, vertex) => Math.min(closest, distanceToPathMeters(vertex, second)),
    Number.POSITIVE_INFINITY,
  );
}
