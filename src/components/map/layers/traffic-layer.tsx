import { memo } from 'react';
import { Polyline } from 'react-native-maps';

import { colors } from '@/constants/theme';
import type { TrafficLevel } from '@/types/itinerary';
import type { TrafficSegment } from '@/types/map-intelligence';

type TrafficStyle = {
  color: string;
  width: number;
  dashPattern?: readonly number[];
};

/** Road traffic uses its own scale, separate from destination crowd. */
const trafficStyleByCondition: Record<TrafficLevel, TrafficStyle> = {
  smooth: { color: colors.semantic.success.main, width: 5 },
  moderate: { color: colors.occupancy.moderate, width: 5 },
  heavy: { color: colors.semantic.danger.main, width: 6 },
  blocked: {
    color: colors.route.closed,
    width: 6,
    dashPattern: [10, 8],
  },
};

export type TrafficLayerProps = {
  segments: readonly TrafficSegment[];
  visible?: boolean;
  onPress?: (segmentId: string) => void;
};

export const TrafficLayer = memo(function TrafficLayer({
  segments,
  visible = true,
  onPress,
}: TrafficLayerProps) {
  if (!visible) return null;

  return (
    <>
      {segments.map((segment) => {
        const style = trafficStyleByCondition[segment.condition];
        return (
          <Polyline
            key={segment.id}
            coordinates={[...segment.path]}
            strokeColor={style.color}
            strokeWidth={style.width}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={
              style.dashPattern ? [...style.dashPattern] : undefined
            }
            zIndex={0}
            tappable={Boolean(onPress)}
            onPress={onPress ? () => onPress(segment.id) : undefined}
          />
        );
      })}
    </>
  );
});
