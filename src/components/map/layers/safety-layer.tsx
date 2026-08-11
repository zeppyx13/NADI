import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Circle, Marker } from 'react-native-maps';

import { AppText } from '@/components/ui';
import { colors, radii } from '@/constants/theme';
import type { RouteRisk } from '@/types/itinerary';
import type { SafetyZone } from '@/types/map-intelligence';

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

function withAlpha(color: string, alpha: string): string {
  return `${color}${alpha}`;
}

export type SafetyLayerProps = {
  zones: readonly SafetyZone[];
  visible?: boolean;
};

export const SafetyLayer = memo(function SafetyLayer({
  zones,
  visible = true,
}: SafetyLayerProps) {
  const { t } = useTranslation('screens');

  if (!visible) return null;

  return (
    <>
      {zones.map((zone) => (
        <Circle
          key={zone.id}
          center={zone}
          radius={zone.radiusMeters}
          fillColor={withAlpha(riskColors[zone.risk], '1F')}
          strokeColor={riskColors[zone.risk]}
          strokeWidth={riskStrokeWidth[zone.risk]}
          zIndex={1}
        />
      ))}

      {/* Risk is never communicated by colour alone. */}
      {zones.map((zone) => (
        <Marker
          key={`${zone.id}-label`}
          identifier={`${zone.id}-label`}
          coordinate={zone}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={2}
          accessibilityLabel={`${zone.name}. ${t(
            `map.safetyRisk.${zone.risk}`,
          )}. ${t(zone.reasonKey)}`}
        >
          <View
            style={[styles.label, { borderColor: riskColors[zone.risk] }]}
          >
            <AppText variant="micro" color={riskColors[zone.risk]}>
              {t(`map.safetyRisk.${zone.risk}`)}
            </AppText>
          </View>
        </Marker>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  label: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    backgroundColor: colors.neutral.white,
  },
});
