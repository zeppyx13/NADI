import {
  GeoJSONSource,
  Layer,
  type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import { memo, useCallback, useMemo } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import {
  alertsToGeoJSON,
  readFeatureString,
} from '@/components/map/map-geojson';
import { colors, iconSizes, layout } from '@/constants/theme';
import type { TravelAlert } from '@/types/travel-alert';

const sourceId = 'nadi-incidents';

const layerIds = {
  routeRelevant: 'nadi-incidents-route-relevant',
  points: 'nadi-incidents-points',
} as const;

export const incidentLayerTopId = layerIds.points;

const emptyAlertIds: readonly string[] = [];

export type IncidentLayerProps = {
  alerts: readonly TravelAlert[];
  selectedAlertId?: string;
  routeRelevantAlertIds?: readonly string[];
  afterId?: string;
  visible?: boolean;
  onPress?: (alertId: string) => void;
};

export const IncidentLayer = memo(function IncidentLayer({
  alerts,
  selectedAlertId,
  routeRelevantAlertIds = emptyAlertIds,
  afterId,
  visible = true,
  onPress,
}: IncidentLayerProps) {
  const data = useMemo(
    () =>
      alertsToGeoJSON(alerts, selectedAlertId, routeRelevantAlertIds),
    [alerts, routeRelevantAlertIds, selectedAlertId],
  );
  const visibility = visible ? 'visible' : 'none';
  const handlePress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      if (!onPress) return;
      event.stopPropagation();
      const feature = event.nativeEvent.features[0];
      const alertId = feature
        ? readFeatureString(feature, 'alertId')
        : undefined;
      if (alertId) onPress(alertId);
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
        id={layerIds.routeRelevant}
        type="circle"
        afterId={afterId}
        filter={['==', ['get', 'routeRelevant'], true]}
        layout={{ visibility }}
        paint={{
          'circle-color': colors.semantic.warning.main,
          'circle-opacity': 0.2,
          'circle-radius': iconSizes.header / 1.25,
          'circle-stroke-color': colors.semantic.warning.main,
          'circle-stroke-opacity': 0.55,
          'circle-stroke-width': 2,
        }}
      />
      <Layer
        id={layerIds.points}
        type="circle"
        afterId={layerIds.routeRelevant}
        layout={{ visibility }}
        paint={{
          'circle-color': [
            'match',
            ['get', 'severity'],
            'info',
            colors.semantic.info.main,
            'warning',
            colors.semantic.warning.main,
            'danger',
            colors.semantic.danger.main,
            colors.semantic.info.main,
          ],
          'circle-radius': [
            'case',
            ['get', 'selected'],
            iconSizes.inline / 1.15,
            iconSizes.badge / 2,
          ],
          'circle-stroke-color': [
            'case',
            ['get', 'selected'],
            colors.neutral.navy,
            colors.neutral.white,
          ],
          'circle-stroke-width': [
            'case',
            ['get', 'selected'],
            4,
            3,
          ],
        }}
      />
    </GeoJSONSource>
  );
});
