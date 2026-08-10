import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { memo, useMemo } from 'react';

import { pilotSafetyToGeoJSON } from '@/components/map/map-geojson';
import { colors, iconSizes } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { MapSafetyCondition } from '@/types/map';

const sourceId = 'nadi-pilot-safety';
const layerId = 'nadi-pilot-safety-rings';

export const safetyLayerTopId = layerId;

export type SafetyLayerProps = {
  destinations: readonly Destination[];
  conditionsByDestinationId: Readonly<
    Record<string, MapSafetyCondition | undefined>
  >;
  afterId?: string;
  visible?: boolean;
};

export const SafetyLayer = memo(function SafetyLayer({
  destinations,
  conditionsByDestinationId,
  afterId,
  visible = true,
}: SafetyLayerProps) {
  const data = useMemo(
    () => pilotSafetyToGeoJSON(destinations, conditionsByDestinationId),
    [conditionsByDestinationId, destinations],
  );

  return (
    <GeoJSONSource id={sourceId} data={data}>
      <Layer
        id={layerId}
        type="circle"
        afterId={afterId}
        layout={{ visibility: visible ? 'visible' : 'none' }}
        paint={{
          'circle-color': colors.neutral.white,
          'circle-opacity': 0.08,
          'circle-radius': iconSizes.header / 1.35,
          'circle-stroke-color': [
            'match',
            ['get', 'routeRisk'],
            'low',
            colors.semantic.success.main,
            'medium',
            colors.semantic.warning.main,
            'high',
            colors.semantic.danger.main,
            colors.semantic.info.main,
          ],
          'circle-stroke-opacity': 0.82,
          'circle-stroke-width': [
            'match',
            ['get', 'routeRisk'],
            'high',
            4,
            3,
          ],
        }}
      />
    </GeoJSONSource>
  );
});
