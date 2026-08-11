import {
  clusterDisableLongitudeDelta,
  mapClusterGridSize,
} from '@/constants/map';
import type { MapLatLng, MapRegion } from '@/types/map';

export type ClusterablePoint = MapLatLng & {
  id: string;
};

export type MapMarkerCluster<TPoint extends ClusterablePoint> = {
  id: string;
  coordinate: MapLatLng;
  /** Region that frames every member, used when the cluster is tapped. */
  region: MapRegion;
  points: readonly TPoint[];
};

export type ClusterResult<TPoint extends ClusterablePoint> = {
  clusters: readonly MapMarkerCluster<TPoint>[];
  singles: readonly TPoint[];
};

const minimumClusterRegionDelta = 0.02;

function clampCellIndex(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(mapClusterGridSize - 1, Math.max(0, Math.floor(value)));
}

function buildClusterRegion(points: readonly ClusterablePoint[]): MapRegion {
  let south = points[0].latitude;
  let north = points[0].latitude;
  let west = points[0].longitude;
  let east = points[0].longitude;

  points.slice(1).forEach((point) => {
    south = Math.min(south, point.latitude);
    north = Math.max(north, point.latitude);
    west = Math.min(west, point.longitude);
    east = Math.max(east, point.longitude);
  });

  return {
    latitude: (south + north) / 2,
    longitude: (west + east) / 2,
    latitudeDelta: Math.max((north - south) * 1.6, minimumClusterRegionDelta),
    longitudeDelta: Math.max((east - west) * 1.6, minimumClusterRegionDelta),
  };
}

/**
 * Zoom-aware grouping for the destination catalog. Deterministic for a given
 * region so the demo never reshuffles markers between renders.
 */
export function clusterPoints<TPoint extends ClusterablePoint>(
  points: readonly TPoint[],
  region: MapRegion,
  pinnedIds: readonly string[] = [],
): ClusterResult<TPoint> {
  if (
    points.length === 0 ||
    region.longitudeDelta <= clusterDisableLongitudeDelta
  ) {
    return { clusters: [], singles: points };
  }

  const pinned = new Set(pinnedIds);
  const west = region.longitude - region.longitudeDelta / 2;
  const south = region.latitude - region.latitudeDelta / 2;
  const cellWidth = region.longitudeDelta / mapClusterGridSize;
  const cellHeight = region.latitudeDelta / mapClusterGridSize;
  const cells = new Map<string, TPoint[]>();
  const singles: TPoint[] = [];

  points.forEach((point) => {
    if (pinned.has(point.id)) {
      singles.push(point);
      return;
    }

    const column = clampCellIndex((point.longitude - west) / cellWidth);
    const row = clampCellIndex((point.latitude - south) / cellHeight);
    const cellId = `${column}:${row}`;
    const cell = cells.get(cellId);
    if (cell) {
      cell.push(point);
      return;
    }
    cells.set(cellId, [point]);
  });

  const clusters: MapMarkerCluster<TPoint>[] = [];

  cells.forEach((cellPoints, cellId) => {
    if (cellPoints.length < 2) {
      singles.push(...cellPoints);
      return;
    }

    const clusterRegion = buildClusterRegion(cellPoints);
    clusters.push({
      id: `cluster-${cellId}`,
      coordinate: {
        latitude: clusterRegion.latitude,
        longitude: clusterRegion.longitude,
      },
      region: clusterRegion,
      points: cellPoints,
    });
  });

  return { clusters, singles };
}
