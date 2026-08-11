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

/**
 * Vertices kept when testing one path against another. Road-aligned polylines
 * carry hundreds to thousands of vertices spaced a few metres apart, so a naive
 * vertex-by-vertex comparison is quadratic and blocks the JS thread. Capping
 * each side keeps the spacing far below the proximity radii NADI tests against.
 */
const PATH_PROXIMITY_SAMPLE_LIMIT = 160;

/** Roughly one degree of latitude, used only to size a bounding-box margin. */
const METERS_PER_DEGREE = 111_320;

type BoundingBox = {
  south: number;
  north: number;
  west: number;
  east: number;
};

function getBoundingBox(path: readonly MapLatLng[]): BoundingBox {
  let south = path[0].latitude;
  let north = path[0].latitude;
  let west = path[0].longitude;
  let east = path[0].longitude;

  for (let index = 1; index < path.length; index += 1) {
    const point = path[index];
    if (point.latitude < south) south = point.latitude;
    if (point.latitude > north) north = point.latitude;
    if (point.longitude < west) west = point.longitude;
    if (point.longitude > east) east = point.longitude;
  }

  return { south, north, west, east };
}

function boundingBoxesOverlap(
  first: BoundingBox,
  second: BoundingBox,
  marginMeters: number,
): boolean {
  const margin = marginMeters / METERS_PER_DEGREE;
  return (
    first.west - margin <= second.east &&
    first.east + margin >= second.west &&
    first.south - margin <= second.north &&
    first.north + margin >= second.south
  );
}

/** Evenly spaced subset of a path, always keeping the first and last vertex. */
function samplePath(
  path: readonly MapLatLng[],
  limit: number,
): readonly MapLatLng[] {
  if (path.length <= limit) return path;

  const stride = Math.ceil(path.length / limit);
  const sampled: MapLatLng[] = [];
  for (let index = 0; index < path.length; index += stride) {
    sampled.push(path[index]);
  }
  const last = path[path.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
}

/**
 * True when the two paths pass within `meters` of each other.
 *
 * A bounding-box test rejects the far-apart pairs outright, and the survivors
 * are compared on sampled vertices. Both steps only cut work; neither changes
 * which pairs count as close at the radii used for scoring.
 */
export function arePathsWithinMeters(
  first: readonly MapLatLng[],
  second: readonly MapLatLng[],
  meters: number,
): boolean {
  if (first.length === 0 || second.length === 0) return false;

  if (
    !boundingBoxesOverlap(
      getBoundingBox(first),
      getBoundingBox(second),
      meters,
    )
  ) {
    return false;
  }

  const sampledFirst = samplePath(first, PATH_PROXIMITY_SAMPLE_LIMIT);
  const sampledSecond = samplePath(second, PATH_PROXIMITY_SAMPLE_LIMIT);

  for (const vertex of sampledFirst) {
    for (const other of sampledSecond) {
      if (distanceMeters(vertex, other) <= meters) return true;
    }
  }
  return false;
}
