import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Marker } from 'react-native-maps';

import { AppText } from '@/components/ui';
import { colors, iconSizes, radii } from '@/constants/theme';
import type { ItineraryLocation, ItineraryStop } from '@/types/itinerary';

export type ItineraryStopLayerProps = {
  stops: readonly ItineraryStop[];
  startLocation?: ItineraryLocation;
  visible?: boolean;
  onPressStop?: (stopId: string) => void;
};

/**
 * Numbered itinerary stops with their progress state. Status is carried by the
 * glyph as well as the colour, so it never depends on colour alone.
 */
export const ItineraryStopLayer = memo(function ItineraryStopLayer({
  stops,
  startLocation,
  visible = true,
  onPressStop,
}: ItineraryStopLayerProps) {
  const { t } = useTranslation('screens');

  if (!visible) return null;

  return (
    <>
      {startLocation && (
        <Marker
          identifier="itinerary-start"
          coordinate={startLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          zIndex={2}
          accessibilityLabel={`${t('map.stopStart')}. ${startLocation.name}`}
        >
          <View style={[styles.marker, styles.markerStart]}>
            <AppText variant="labelMd" color={colors.neutral.white}>
              {t('map.stopStartShort')}
            </AppText>
          </View>
        </Marker>
      )}

      {stops.map((stop, index) => {
        const isCompleted = stop.status === 'completed';
        const isCurrent = stop.status === 'current';
        const isSkipped = stop.status === 'skipped';
        return (
          <Marker
            key={stop.id}
            identifier={stop.id}
            coordinate={stop.place}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={isCurrent ? 4 : 3}
            accessibilityLabel={`${index + 1}. ${stop.place.name}. ${t(
              `map.stopStatus.${stop.status}`,
            )}`}
            onPress={() => onPressStop?.(stop.id)}
          >
            <View
              style={[
                styles.marker,
                isCompleted && styles.markerCompleted,
                isCurrent && styles.markerCurrent,
                isSkipped && styles.markerSkipped,
              ]}
            >
              {isCompleted ? (
                <Check size={iconSizes.inline} color={colors.neutral.white} />
              ) : (
                <AppText
                  variant="labelMd"
                  color={isCurrent ? colors.neutral.white : colors.brand[700]}
                >
                  {index + 1}
                </AppText>
              )}
            </View>
          </Marker>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  marker: {
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.white,
    backgroundColor: colors.neutral.surfaceMuted,
  },
  markerStart: {
    backgroundColor: colors.neutral.navy,
  },
  markerCompleted: {
    backgroundColor: colors.semantic.success.main,
  },
  markerCurrent: {
    minWidth: 34,
    height: 34,
    borderWidth: 3,
    borderColor: colors.neutral.navy,
    backgroundColor: colors.teal[600],
  },
  markerSkipped: {
    opacity: 0.5,
  },
});
