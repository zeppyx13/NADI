import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { colors, radii } from '@/constants/theme';
import type { TravelAlert } from '@/types/travel-alert';

const emptyAlertIds: readonly string[] = [];

const severityColors: Record<TravelAlert['severity'], string> = {
  info: colors.semantic.info.main,
  warning: colors.semantic.warning.main,
  danger: colors.semantic.danger.main,
};

export type IncidentLayerProps = {
  alerts: readonly TravelAlert[];
  selectedAlertId?: string;
  routeRelevantAlertIds?: readonly string[];
  visible?: boolean;
  onPress?: (alertId: string) => void;
};

export const IncidentLayer = memo(function IncidentLayer({
  alerts,
  selectedAlertId,
  routeRelevantAlertIds = emptyAlertIds,
  visible = true,
  onPress,
}: IncidentLayerProps) {
  if (!visible) return null;

  return (
    <>
      {alerts.map((alert) => {
        const isSelected = alert.id === selectedAlertId;
        const isRouteRelevant = routeRelevantAlertIds.includes(alert.id);
        return (
          <Marker
            key={alert.id}
            identifier={alert.id}
            coordinate={alert}
            tracksViewChanges={false}
            zIndex={isSelected ? 5 : 4}
            accessibilityLabel={alert.locationName}
            onPress={() => onPress?.(alert.id)}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: severityColors[alert.severity] },
                isRouteRelevant && styles.markerRouteRelevant,
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
  marker: {
    width: 16,
    height: 16,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.neutral.white,
    transform: [{ rotate: '45deg' }],
  },
  markerRouteRelevant: {
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  markerSelected: {
    width: 26,
    height: 26,
    borderWidth: 4,
    borderColor: colors.neutral.navy,
  },
});
