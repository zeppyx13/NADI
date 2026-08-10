import {
  GeoJSONSource,
  Layer,
  type GeoJSONSourceRef,
  type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import { memo, useCallback, useMemo, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import {
  destinationsToGeoJSON,
  readFeatureNumber,
  readFeatureString,
  readPointCoordinate,
} from '@/components/map/map-geojson';
import { colors, iconSizes, layout } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { MapDestinationPressResult } from '@/types/map';

const sourceIds = {
  catalog: 'nadi-destinations-catalog',
  featured: 'nadi-destinations-featured',
} as const;

const layerIds = {
  clusters: 'nadi-destination-clusters',
  clusterCount: 'nadi-destination-cluster-count',
  catalog: 'nadi-destination-catalog-points',
  featured: 'nadi-destination-featured-points',
  selected: 'nadi-destination-selected-point',
} as const;

export const destinationLayerTopId = layerIds.selected;

const emptyDestinationIds: readonly string[] = [];

export type DestinationLayerProps = {
  destinations: readonly Destination[];
  selectedDestinationId?: string;
  priorityDestinationIds?: readonly string[];
  afterId?: string;
  visible?: boolean;
  onPress?: (result: MapDestinationPressResult) => void;
};

export const DestinationLayer = memo(function DestinationLayer({
  destinations,
  selectedDestinationId,
  priorityDestinationIds = emptyDestinationIds,
  afterId,
  visible = true,
  onPress,
}: DestinationLayerProps) {
  const catalogSourceRef = useRef<GeoJSONSourceRef>(null);
  const collections = useMemo(
    () =>
      destinationsToGeoJSON(
        destinations,
        selectedDestinationId,
        priorityDestinationIds,
      ),
    [destinations, priorityDestinationIds, selectedDestinationId],
  );
  const visibility = visible ? 'visible' : 'none';

  const handleCatalogPress = useCallback(
    async (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      const feature = event.nativeEvent.features[0];
      if (!feature || !onPress) return;
      event.stopPropagation();

      const clusterId = readFeatureNumber(feature, 'cluster_id');
      if (clusterId !== undefined) {
        let zoom: number | undefined;
        try {
          zoom = await catalogSourceRef.current?.getClusterExpansionZoom(
            clusterId,
          );
        } catch {
          return;
        }
        const coordinate =
          readPointCoordinate(feature) ?? event.nativeEvent.lngLat;
        if (zoom !== undefined) {
          onPress({ type: 'cluster', coordinate, zoom });
        }
        return;
      }

      const destinationId = readFeatureString(feature, 'destinationId');
      if (destinationId) {
        onPress({ type: 'destination', destinationId });
      }
    },
    [onPress],
  );

  const handleFeaturedPress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      if (!onPress) return;
      event.stopPropagation();
      const feature = event.nativeEvent.features[0];
      const destinationId = feature
        ? readFeatureString(feature, 'destinationId')
        : undefined;
      if (destinationId) {
        onPress({ type: 'destination', destinationId });
      }
    },
    [onPress],
  );

  return (
    <>
      <GeoJSONSource
        ref={catalogSourceRef}
        id={sourceIds.catalog}
        data={collections.catalog}
        cluster
        clusterRadius={48}
        clusterMaxZoom={11}
        hitbox={{
          top: layout.minTouchTarget / 2,
          right: layout.minTouchTarget / 2,
          bottom: layout.minTouchTarget / 2,
          left: layout.minTouchTarget / 2,
        }}
        onPress={onPress ? handleCatalogPress : undefined}
      >
        <Layer
          id={layerIds.clusters}
          type="circle"
          afterId={afterId}
          filter={['has', 'point_count']}
          layout={{ visibility }}
          paint={{
            'circle-color': colors.brand[600],
            'circle-opacity': 0.88,
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              iconSizes.inline,
              8,
              iconSizes.button,
              18,
              iconSizes.header,
            ],
            'circle-stroke-color': colors.neutral.white,
            'circle-stroke-width': 3,
          }}
        />
        <Layer
          id={layerIds.clusterCount}
          type="symbol"
          afterId={layerIds.clusters}
          filter={['has', 'point_count']}
          layout={{
            visibility,
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-allow-overlap': true,
          }}
          paint={{
            'text-color': colors.neutral.white,
          }}
        />
        <Layer
          id={layerIds.catalog}
          type="circle"
          afterId={layerIds.clusterCount}
          filter={['!', ['has', 'point_count']]}
          layout={{ visibility }}
          paint={{
            'circle-color': colors.brand[500],
            'circle-opacity': 0.9,
            'circle-radius': iconSizes.badge / 2,
            'circle-stroke-color': colors.neutral.white,
            'circle-stroke-width': 2,
          }}
        />
      </GeoJSONSource>

      <GeoJSONSource
        id={sourceIds.featured}
        data={collections.featured}
        hitbox={{
          top: layout.minTouchTarget / 2,
          right: layout.minTouchTarget / 2,
          bottom: layout.minTouchTarget / 2,
          left: layout.minTouchTarget / 2,
        }}
        onPress={onPress ? handleFeaturedPress : undefined}
      >
        <Layer
          id={layerIds.featured}
          type="circle"
          afterId={layerIds.catalog}
          filter={['==', ['get', 'selected'], false]}
          layout={{ visibility }}
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
              colors.brand[600],
            ],
            'circle-radius': [
              'case',
              ['get', 'priority'],
              iconSizes.inline / 1.4,
              iconSizes.badge / 2,
            ],
            'circle-stroke-color': colors.neutral.white,
            'circle-stroke-width': 3,
          }}
        />
        <Layer
          id={layerIds.selected}
          type="circle"
          afterId={layerIds.featured}
          filter={['==', ['get', 'selected'], true]}
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
              colors.brand[600],
            ],
            'circle-radius': iconSizes.inline / 1.15,
            'circle-stroke-color': colors.neutral.navy,
            'circle-stroke-width': 4,
          }}
        />
      </GeoJSONSource>
    </>
  );
});
