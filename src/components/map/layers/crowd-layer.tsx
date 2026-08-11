import { memo } from 'react';
import { Circle } from 'react-native-maps';

import { colors } from '@/constants/theme';
import type { OccupancyLevel } from '@/constants/theme';
import type { Destination } from '@/types/destination';

/** Halo radius in meters per occupancy level. */
const crowdRadiusMeters: Record<OccupancyLevel, number> = {
  low: 900,
  moderate: 1200,
  high: 1500,
  critical: 1800,
};

function withAlpha(color: string, alpha: string): string {
  return `${color}${alpha}`;
}

export type CrowdLayerProps = {
  destinations: readonly Destination[];
  visible?: boolean;
};

export const CrowdLayer = memo(function CrowdLayer({
  destinations,
  visible = true,
}: CrowdLayerProps) {
  if (!visible) return null;

  return (
    <>
      {destinations.map((destination) => {
        const level = destination.occupancyLevel;
        if (!level) return null;
        const color = colors.occupancy[level];
        return (
          <Circle
            key={`crowd-${destination.id}`}
            center={destination}
            radius={crowdRadiusMeters[level]}
            fillColor={withAlpha(color, '29')}
            strokeColor={withAlpha(color, '80')}
            strokeWidth={2}
            zIndex={0}
          />
        );
      })}
    </>
  );
});
