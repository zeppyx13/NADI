import { memo, useMemo } from 'react';
import { Circle } from 'react-native-maps';

import { colors } from '@/constants/theme';
import type { OccupancyLevel } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { DestinationCrowd } from '@/types/map-intelligence';

/** Halo radius in meters per crowd level. */
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
  crowd: readonly DestinationCrowd[];
  destinations: readonly Destination[];
  visible?: boolean;
};

export const CrowdLayer = memo(function CrowdLayer({
  crowd,
  destinations,
  visible = true,
}: CrowdLayerProps) {
  const destinationsById = useMemo(
    () => new Map(destinations.map((destination) => [destination.id, destination])),
    [destinations],
  );

  if (!visible) return null;

  return (
    <>
      {crowd.map((entry) => {
        const destination = destinationsById.get(entry.destinationId);
        // Crowd coverage is partial on purpose; skip anything we cannot place.
        if (!destination) return null;
        const color = colors.occupancy[entry.level];
        return (
          <Circle
            key={`crowd-${entry.destinationId}`}
            center={destination}
            radius={crowdRadiusMeters[entry.level]}
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
