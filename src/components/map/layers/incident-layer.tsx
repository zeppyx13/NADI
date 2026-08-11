import { CalendarDays, Construction, TriangleAlert } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, Polyline } from 'react-native-maps';

import { colors, iconSizes, radii } from '@/constants/theme';
import type { AlertSeverity } from '@/types/travel-alert';
import type { MapIncident, MapIncidentType } from '@/types/map-intelligence';

const emptyIncidentIds: readonly string[] = [];

const severityColors: Record<AlertSeverity, string> = {
  info: colors.semantic.info.main,
  warning: colors.semantic.warning.main,
  danger: colors.semantic.danger.main,
};

/** Closures and works read differently from crashes, so the glyph changes too. */
function IncidentGlyph({ type, color }: { type: MapIncidentType; color: string }) {
  if (type === 'local-event') {
    return <CalendarDays size={iconSizes.inline} color={color} />;
  }
  if (type === 'road-closure' || type === 'road-disruption') {
    return <Construction size={iconSizes.inline} color={color} />;
  }
  return <TriangleAlert size={iconSizes.inline} color={color} />;
}

export type IncidentLayerProps = {
  incidents: readonly MapIncident[];
  selectedIncidentId?: string;
  routeRelevantIncidentIds?: readonly string[];
  visible?: boolean;
  onPress?: (incidentId: string) => void;
};

export const IncidentLayer = memo(function IncidentLayer({
  incidents,
  selectedIncidentId,
  routeRelevantIncidentIds = emptyIncidentIds,
  visible = true,
  onPress,
}: IncidentLayerProps) {
  if (!visible) return null;

  return (
    <>
      {incidents.map((incident) =>
        incident.affectedPath && incident.affectedPath.length > 1 ? (
          <Polyline
            key={`${incident.id}-path`}
            coordinates={[...incident.affectedPath]}
            strokeColor={severityColors[incident.severity]}
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
            lineDashPattern={[8, 6]}
            zIndex={3}
          />
        ) : null,
      )}

      {incidents.map((incident) => {
        const isSelected = incident.id === selectedIncidentId;
        const isRouteRelevant = routeRelevantIncidentIds.includes(incident.id);
        const color = severityColors[incident.severity];
        return (
          <Marker
            key={incident.id}
            identifier={incident.id}
            coordinate={incident}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={isSelected ? 9 : 8}
            accessibilityLabel={incident.locationName}
            onPress={() => onPress?.(incident.id)}
          >
            <View
              style={[
                styles.marker,
                { backgroundColor: color },
                // A suspected report is drawn hollow until an operator verifies it.
                incident.status === 'suspected' && styles.markerSuspected,
                incident.status === 'suspected' && { borderColor: color },
                isRouteRelevant && styles.markerRouteRelevant,
                isSelected && styles.markerSelected,
              ]}
            >
              <IncidentGlyph
                type={incident.type}
                color={
                  incident.status === 'suspected' ? color : colors.neutral.white
                }
              />
            </View>
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  marker: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  markerSuspected: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: colors.neutral.white,
  },
  markerRouteRelevant: {
    width: 32,
    height: 32,
    borderWidth: 3,
  },
  markerSelected: {
    width: 38,
    height: 38,
    borderWidth: 4,
    borderColor: colors.neutral.navy,
  },
});
