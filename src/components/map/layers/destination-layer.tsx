import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Marker } from 'react-native-maps';

import { AppText } from '@/components/ui';
import { colors, radii } from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { MapDestinationPressResult, MapRegion } from '@/types/map';
import { clusterPoints } from '@/utils/map-clustering';

const emptyDestinationIds: readonly string[] = [];

const occupancyColors = colors.occupancy;

export type DestinationLayerProps = {
  destinations: readonly Destination[];
  region: MapRegion;
  selectedDestinationId?: string;
  priorityDestinationIds?: readonly string[];
  visible?: boolean;
  onPress?: (result: MapDestinationPressResult) => void;
};

function resolveMarkerColor(destination: Destination): string {
  if (!destination.occupancyLevel) return colors.brand[500];
  return occupancyColors[destination.occupancyLevel];
}

export const DestinationLayer = memo(function DestinationLayer({
  destinations,
  region,
  selectedDestinationId,
  priorityDestinationIds = emptyDestinationIds,
  visible = true,
  onPress,
}: DestinationLayerProps) {
  const { t } = useTranslation('screens');
  const pinnedIds = useMemo(
    () =>
      [selectedDestinationId, ...priorityDestinationIds].filter(
        (id): id is string => Boolean(id),
      ),
    [priorityDestinationIds, selectedDestinationId],
  );
  const { clusters, singles } = useMemo(
    () => clusterPoints(destinations, region, pinnedIds),
    [destinations, pinnedIds, region],
  );

  if (!visible) return null;

  return (
    <>
      {clusters.map((cluster) => (
        <Marker
          key={cluster.id}
          identifier={cluster.id}
          coordinate={cluster.coordinate}
          tracksViewChanges={false}
          accessibilityLabel={t('map.clusterAccessibility', {
            count: cluster.points.length,
          })}
          onPress={() =>
            onPress?.({
              type: 'cluster',
              coordinate: cluster.coordinate,
              region: cluster.region,
            })
          }
        >
          <View style={styles.cluster}>
            <AppText variant="labelMd" color={colors.neutral.white}>
              {cluster.points.length}
            </AppText>
          </View>
        </Marker>
      ))}

      {singles.map((destination) => {
        const isSelected = destination.id === selectedDestinationId;
        const isPriority = priorityDestinationIds.includes(destination.id);
        return (
          <Marker
            key={destination.id}
            identifier={destination.id}
            coordinate={destination}
            tracksViewChanges={false}
            zIndex={isSelected ? 3 : isPriority ? 2 : 1}
            accessibilityLabel={destination.name}
            onPress={() =>
              onPress?.({ type: 'destination', destinationId: destination.id })
            }
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: resolveMarkerColor(destination) },
                isPriority && styles.markerPriority,
                isSelected && styles.markerSelected,
              ]}
            />
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  cluster: {
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[600],
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  markerPriority: {
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  markerSelected: {
    width: 28,
    height: 28,
    borderWidth: 4,
    borderColor: colors.neutral.navy,
  },
});
