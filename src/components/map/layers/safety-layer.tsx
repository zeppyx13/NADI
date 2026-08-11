import { memo } from 'react';
import { Circle } from 'react-native-maps';

import { colors } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { RouteRisk } from '@/types/itinerary';
import type { MapSafetyCondition } from '@/types/map';

const safetyRadiusMeters = 1100;

const riskColors: Record<RouteRisk, string> = {
  low: colors.semantic.success.main,
  medium: colors.semantic.warning.main,
  high: colors.semantic.danger.main,
};

const riskStrokeWidth: Record<RouteRisk, number> = {
  low: 2,
  medium: 3,
  high: 4,
};

export type SafetyLayerProps = {
  destinations: readonly Destination[];
  conditionsByDestinationId: Readonly<
    Record<string, MapSafetyCondition | undefined>
  >;
  visible?: boolean;
};

export const SafetyLayer = memo(function SafetyLayer({
  destinations,
  conditionsByDestinationId,
  visible = true,
}: SafetyLayerProps) {
  if (!visible) return null;

  return (
    <>
      {destinations.map((destination) => {
        const risk = conditionsByDestinationId[destination.id]?.routeRisk;
        if (!risk) return null;
        return (
          <Circle
            key={`safety-${destination.id}`}
            center={destination}
            radius={safetyRadiusMeters}
            fillColor="transparent"
            strokeColor={riskColors[risk]}
            strokeWidth={riskStrokeWidth[risk]}
            zIndex={1}
          />
        );
      })}
    </>
  );
});
