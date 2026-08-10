import {
  GeoJSONSource,
  Layer,
  type PressEventWithFeatures,
} from '@maplibre/maplibre-react-native';
import { memo, useCallback, useMemo } from 'react';
import type { NativeSyntheticEvent } from 'react-native';

import {
  readFeatureString,
  routesToGeoJSON,
} from '@/components/map/map-geojson';
import { colors, layout } from '@/constants/theme';
import type { MapRouteLine, MapRouteVisualState } from '@/types/map';

const sourceId = 'nadi-routes';
const casingLayerId = 'nadi-routes-casing';

const routeLayerOrder = [
  { visualState: 'fastest', id: 'nadi-route-fastest', afterId: casingLayerId },
  {
    visualState: 'safest',
    id: 'nadi-route-safest',
    afterId: 'nadi-route-fastest',
  },
  {
    visualState: 'balanced',
    id: 'nadi-route-balanced',
    afterId: 'nadi-route-safest',
  },
  {
    visualState: 'active',
    id: 'nadi-route-active',
    afterId: 'nadi-route-balanced',
  },
  {
    visualState: 'alternative',
    id: 'nadi-route-alternative',
    afterId: 'nadi-route-active',
  },
  {
    visualState: 'affected',
    id: 'nadi-route-affected',
    afterId: 'nadi-route-alternative',
  },
] as const satisfies readonly {
  visualState: MapRouteVisualState;
  id: string;
  afterId: string;
}[];

export const routeLayerTopId = 'nadi-route-affected';

const routePaintByState: Record<
  MapRouteVisualState,
  {
    color: string;
    width: number;
    opacity: number;
    dasharray?: readonly number[];
  }
> = {
  fastest: {
    color: colors.route.fastest,
    width: 4,
    opacity: 0.9,
  },
  safest: {
    color: colors.route.safest,
    width: 4,
    opacity: 0.9,
  },
  balanced: {
    color: colors.route.balanced,
    width: 4,
    opacity: 0.9,
  },
  active: {
    color: colors.brand[700],
    width: 6,
    opacity: 1,
  },
  alternative: {
    color: colors.route.alternate,
    width: 5,
    opacity: 0.95,
    dasharray: [1.5, 1.25],
  },
  affected: {
    color: colors.route.incident,
    width: 5,
    opacity: 0.9,
    dasharray: [0.75, 1.25],
  },
};

export type RouteLayerProps = {
  routes: readonly MapRouteLine[];
  afterId?: string;
  visible?: boolean;
  onPress?: (routeId: string) => void;
};

export const RouteLayer = memo(function RouteLayer({
  routes,
  afterId,
  visible = true,
  onPress,
}: RouteLayerProps) {
  const data = useMemo(() => routesToGeoJSON(routes), [routes]);
  const visibility = visible ? 'visible' : 'none';
  const handlePress = useCallback(
    (event: NativeSyntheticEvent<PressEventWithFeatures>) => {
      if (!onPress) return;
      event.stopPropagation();
      const feature = event.nativeEvent.features[0];
      const routeId = feature
        ? readFeatureString(feature, 'routeId')
        : undefined;
      if (routeId) onPress(routeId);
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
        id={casingLayerId}
        type="line"
        afterId={afterId}
        layout={{
          visibility,
          'line-cap': 'round',
          'line-join': 'round',
        }}
        paint={{
          'line-color': colors.neutral.white,
          'line-opacity': 0.74,
          'line-width': [
            'case',
            ['==', ['get', 'visualState'], 'active'],
            9,
            7,
          ],
        }}
      />
      {routeLayerOrder.map(({ visualState, id, afterId: stateAfterId }) => {
        const routePaint = routePaintByState[visualState];
        return (
          <Layer
            key={visualState}
            id={id}
            type="line"
            afterId={stateAfterId}
            filter={['==', ['get', 'visualState'], visualState]}
            layout={{
              visibility,
              'line-cap': 'round',
              'line-join': 'round',
            }}
            paint={{
              'line-color': routePaint.color,
              'line-opacity': routePaint.opacity,
              'line-width': routePaint.width,
              ...(routePaint.dasharray
                ? { 'line-dasharray': [...routePaint.dasharray] }
                : {}),
            }}
          />
        );
      })}
    </GeoJSONSource>
  );
});
