import { Cctv, TrafficCone } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Marker } from 'react-native-maps';

import { AppText } from '@/components/ui';
import { colors, iconSizes, radii } from '@/constants/theme';
import type { MapLatLng, MapRegion } from '@/types/map';
import type {
  MonitoringPoint,
  MonitoringPointStatus,
} from '@/types/map-intelligence';
import { clusterPoints } from '@/utils/map-clustering';

const statusColors: Record<MonitoringPointStatus, string> = {
  online: colors.brand[700],
  limited: colors.semantic.warning.main,
  offline: colors.neutral.textMuted,
};

export type MonitoringLayerProps = {
  points: readonly MonitoringPoint[];
  region: MapRegion;
  selectedPointId?: string;
  visible?: boolean;
  onPressPoint?: (pointId: string) => void;
  onPressCluster?: (region: MapRegion, coordinate: MapLatLng) => void;
};

export const MonitoringLayer = memo(function MonitoringLayer({
  points,
  region,
  selectedPointId,
  visible = true,
  onPressPoint,
  onPressCluster,
}: MonitoringLayerProps) {
  const { t } = useTranslation('screens');
  const pinnedIds = useMemo(
    () => (selectedPointId ? [selectedPointId] : []),
    [selectedPointId],
  );
  const { clusters, singles } = useMemo(
    () => clusterPoints(points, region, pinnedIds),
    [pinnedIds, points, region],
  );

  if (!visible) return null;

  return (
    <>
      {clusters.map((cluster) => (
        <Marker
          key={cluster.id}
          identifier={`monitoring-${cluster.id}`}
          coordinate={cluster.coordinate}
          tracksViewChanges={false}
          zIndex={5}
          accessibilityLabel={t('map.monitoringClusterAccessibility', {
            count: cluster.points.length,
          })}
          onPress={() => onPressCluster?.(cluster.region, cluster.coordinate)}
        >
          <View style={styles.cluster}>
            <Cctv size={iconSizes.inline} color={colors.neutral.white} />
            <AppText variant="labelMd" color={colors.neutral.white}>
              {cluster.points.length}
            </AppText>
          </View>
        </Marker>
      ))}

      {singles.map((point) => {
        const isSelected = point.id === selectedPointId;
        return (
          <Marker
            key={point.id}
            identifier={point.id}
            coordinate={point}
            tracksViewChanges={false}
            zIndex={isSelected ? 7 : 5}
            accessibilityLabel={`${point.name}, ${point.area}`}
            onPress={() => onPressPoint?.(point.id)}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: statusColors[point.status] },
                isSelected && styles.markerSelected,
              ]}
            >
              {point.type === 'atcs' ? (
                <TrafficCone
                  size={iconSizes.inline}
                  color={colors.neutral.white}
                />
              ) : (
                <Cctv size={iconSizes.inline} color={colors.neutral.white} />
              )}
            </View>
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  cluster: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[800],
  },
  marker: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  markerSelected: {
    width: 36,
    height: 36,
    borderWidth: 4,
    borderColor: colors.neutral.navy,
  },
});
