import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Marker } from 'react-native-maps';

import { AppText } from '@/components/ui';
import { colors, radii } from '@/constants/theme';
import type { ParkingStatus } from '@/types/itinerary';
import type { ParkingArea } from '@/types/map-intelligence';

const statusColors: Record<ParkingStatus, string> = {
  available: colors.semantic.success.main,
  limited: colors.occupancy.moderate,
  full: colors.semantic.danger.main,
  unknown: colors.neutral.textMuted,
};

export type ParkingLayerProps = {
  areas: readonly ParkingArea[];
  visible?: boolean;
  onPress?: (parkingId: string) => void;
};

export const ParkingLayer = memo(function ParkingLayer({
  areas,
  visible = true,
  onPress,
}: ParkingLayerProps) {
  const { t } = useTranslation('screens');

  if (!visible) return null;

  return (
    <>
      {areas.map((area) => (
        <Marker
          key={area.id}
          identifier={area.id}
          coordinate={area}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={4}
          // Status is spoken, never left to the marker colour alone.
          accessibilityLabel={`${area.name}. ${t(
            `map.parkingStatus.${area.status}`,
          )}`}
          onPress={() => onPress?.(area.id)}
        >
          <View
            style={[styles.marker, { backgroundColor: statusColors[area.status] }]}
          >
            <AppText variant="labelMd" color={colors.neutral.white}>
              P
            </AppText>
          </View>
        </Marker>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  marker: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
});
