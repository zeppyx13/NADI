import { memo } from 'react';
import { Polyline } from 'react-native-maps';

import { colors } from '@/constants/theme';
import type { MapRouteLine, MapRouteVisualState } from '@/types/map';

type RouteStyle = {
  color: string;
  width: number;
  dashPattern?: readonly number[];
};

const routeStyleByState: Record<MapRouteVisualState, RouteStyle> = {
  fastest: { color: colors.route.fastest, width: 5 },
  safest: { color: colors.route.safest, width: 5 },
  balanced: { color: colors.route.balanced, width: 5 },
  active: { color: colors.brand[700], width: 7 },
  alternative: {
    color: colors.route.alternate,
    width: 6,
    dashPattern: [12, 8],
  },
  affected: {
    color: colors.route.incident,
    width: 6,
    dashPattern: [6, 8],
  },
};

const casingWidthOffset = 4;

export type RouteLayerProps = {
  routes: readonly MapRouteLine[];
  visible?: boolean;
  onPress?: (routeId: string) => void;
};

export const RouteLayer = memo(function RouteLayer({
  routes,
  visible = true,
  onPress,
}: RouteLayerProps) {
  if (!visible) return null;

  return (
    <>
      {routes.map((route) => {
        const style = routeStyleByState[route.visualState];
        const coordinates = [...route.coordinates];
        return (
          <Polyline
            key={`${route.id}-casing`}
            coordinates={coordinates}
            strokeColor={colors.neutral.white}
            strokeWidth={style.width + casingWidthOffset}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        );
      })}
      {routes.map((route) => {
        const style = routeStyleByState[route.visualState];
        return (
          <Polyline
            key={route.id}
            coordinates={[...route.coordinates]}
            strokeColor={style.color}
            strokeWidth={style.width}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={
              style.dashPattern ? [...style.dashPattern] : undefined
            }
            zIndex={2}
            tappable={Boolean(onPress)}
            onPress={onPress ? () => onPress(route.id) : undefined}
          />
        );
      })}
    </>
  );
});
