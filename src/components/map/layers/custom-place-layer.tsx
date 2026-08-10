import {
  GeoJSONSource,
  Layer,
  type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import { memo, useCallback, useMemo } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import {
  customPlacesToGeoJSON,
  readFeatureString,
} from '@/components/map/map-geojson';
import { colors, iconSizes, layout } from '@/constants/theme';
import type { ItineraryPlace } from '@/types/itinerary';

const sourceId = 'nadi-custom-places';

const layerIds = {
  points: 'nadi-custom-place-points',
  selected: 'nadi-custom-place-selected',
} as const;

export const customPlaceLayerTopId = layerIds.selected;

export type CustomPlaceLayerProps = {
  places: readonly ItineraryPlace[];
  selectedPlaceId?: string;
  afterId?: string;
  visible?: boolean;
  onPress?: (placeId: string) => void;
};

export const CustomPlaceLayer = memo(function CustomPlaceLayer({
  places,
  selectedPlaceId,
  afterId,
  visible = true,
  onPress,
}: CustomPlaceLayerProps) {
  const data = useMemo(
    () => customPlacesToGeoJSON(places, selectedPlaceId),
    [places, selectedPlaceId],
  );
  const visibility = visible ? 'visible' : 'none';
  const handlePress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      if (!onPress) return;
      event.stopPropagation();
      const feature = event.nativeEvent.features[0];
      const placeId = feature
        ? readFeatureString(feature, 'placeId')
        : undefined;
      if (placeId) onPress(placeId);
    },
    [onPress],
  );

  return (
    <GeoJSONSource
      id={sourceId}
      data={data}
      hitbox={{
        top: layout.minTouchTarget / 2,
        right: layout.minTouchTarget / 2,
        bottom: layout.minTouchTarget / 2,
        left: layout.minTouchTarget / 2,
      }}
      onPress={onPress ? handlePress : undefined}
    >
      <Layer
        id={layerIds.points}
        type="circle"
        afterId={afterId}
        filter={['==', ['get', 'selected'], false]}
        layout={{ visibility }}
        paint={{
          'circle-color': colors.teal[600],
          'circle-radius': iconSizes.badge / 2,
          'circle-stroke-color': colors.neutral.white,
          'circle-stroke-width': 3,
        }}
      />
      <Layer
        id={layerIds.selected}
        type="circle"
        afterId={layerIds.points}
        filter={['==', ['get', 'selected'], true]}
        layout={{ visibility }}
        paint={{
          'circle-color': colors.teal[700],
          'circle-radius': iconSizes.inline / 1.15,
          'circle-stroke-color': colors.neutral.navy,
          'circle-stroke-width': 4,
        }}
      />
    </GeoJSONSource>
  );
});
