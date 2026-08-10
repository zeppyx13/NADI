import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { memo, useMemo } from 'react';

import { userLocationToGeoJSON } from '@/components/map/map-geojson';
import { colors, iconSizes } from '@/constants/theme';
import type { MapCoordinate } from '@/types/map';

const sourceId = 'nadi-user-location';

const layerIds = {
  halo: 'nadi-user-location-halo',
  point: 'nadi-user-location-point',
} as const;

export const userLocationLayerTopId = layerIds.point;

export type UserLocationLayerProps = {
  coordinate?: MapCoordinate;
  afterId?: string;
  visible?: boolean;
};

export const UserLocationLayer = memo(function UserLocationLayer({
  coordinate,
  afterId,
  visible = true,
}: UserLocationLayerProps) {
  const data = useMemo(() => userLocationToGeoJSON(coordinate), [coordinate]);
  const visibility = visible ? 'visible' : 'none';

  return (
    <GeoJSONSource id={sourceId} data={data}>
      <Layer
        id={layerIds.halo}
        type="circle"
        afterId={afterId}
        layout={{ visibility }}
        paint={{
          'circle-color': colors.brand[400],
          'circle-opacity': 0.2,
          'circle-radius': iconSizes.button / 1.25,
        }}
      />
      <Layer
        id={layerIds.point}
        type="circle"
        afterId={layerIds.halo}
        layout={{ visibility }}
        paint={{
          'circle-color': colors.brand[600],
          'circle-radius': iconSizes.badge / 2.6,
          'circle-stroke-color': colors.neutral.white,
          'circle-stroke-width': 3,
        }}
      />
    </GeoJSONSource>
  );
});
