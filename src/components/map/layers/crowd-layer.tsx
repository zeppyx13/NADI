import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { memo, useMemo } from 'react';

import { pilotCrowdToGeoJSON } from '@/components/map/map-geojson';
import { colors, iconSizes } from '@/constants/theme';
import type { Destination } from '@/types/destination';

const sourceId = 'nadi-pilot-crowd';
const layerId = 'nadi-pilot-crowd-halos';

export const crowdLayerTopId = layerId;

export type CrowdLayerProps = {
  destinations: readonly Destination[];
  afterId?: string;
  visible?: boolean;
};

export const CrowdLayer = memo(function CrowdLayer({
  destinations,
  afterId,
  visible = true,
}: CrowdLayerProps) {
  const data = useMemo(
    () => pilotCrowdToGeoJSON(destinations),
    [destinations],
  );

  return (
    <GeoJSONSource id={sourceId} data={data}>
      <Layer
        id={layerId}
        type="circle"
        afterId={afterId}
        layout={{ visibility: visible ? 'visible' : 'none' }}
        paint={{
          'circle-color': [
            'match',
            ['get', 'occupancyLevel'],
            'low',
            colors.occupancy.low,
            'moderate',
            colors.occupancy.moderate,
            'high',
            colors.occupancy.high,
            'critical',
            colors.occupancy.critical,
            colors.brand[500],
          ],
          'circle-opacity': 0.16,
          'circle-radius': [
            'match',
            ['get', 'occupancyLevel'],
            'low',
            iconSizes.header,
            'moderate',
            iconSizes.header * 1.25,
            'high',
            iconSizes.header * 1.5,
            'critical',
            iconSizes.header * 1.75,
            iconSizes.header,
          ],
          'circle-stroke-color': [
            'match',
            ['get', 'occupancyLevel'],
            'low',
            colors.occupancy.low,
            'moderate',
            colors.occupancy.moderate,
            'high',
            colors.occupancy.high,
            'critical',
            colors.occupancy.critical,
            colors.brand[500],
          ],
          'circle-stroke-opacity': 0.5,
          'circle-stroke-width': 1.5,
        }}
      />
    </GeoJSONSource>
  );
});
