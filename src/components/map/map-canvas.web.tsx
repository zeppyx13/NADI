import { MapPin } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { MapCanvasProps } from './map-canvas';

export function MapCanvas({
  destinations,
  selectedDestination,
  activePlace,
  mapPadding,
  onSelectDestination,
}: MapCanvasProps) {
  const { t } = useTranslation('screens');
  const priorityDestinations = destinations.filter(
    (destination) =>
      destination.intelligenceCoverage === 'pilot' ||
      destination.id === selectedDestination?.id,
  );
  const previewDestinations = (
    priorityDestinations.length > 0 ? priorityDestinations : destinations
  ).slice(0, 5);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: mapPadding.top, paddingBottom: mapPadding.bottom },
      ]}
    >
      <View style={styles.grid} />
      <View style={styles.copy}>
        <MapPin size={iconSizes.empty} color={colors.brand[600]} />
        <AppText variant="headingMd" style={styles.centered}>
          {t('map.webFallback')}
        </AppText>
        <AppText
          variant="bodyMd"
          color={colors.neutral.textSecondary}
          style={styles.centered}
        >
          {t('map.webFallbackDescription')}
        </AppText>
      </View>
      <View style={styles.destinationList}>
        {activePlace?.source === 'custom-map-point' && (
          <View style={[styles.destination, styles.destinationSelected]}>
            <AppText variant="labelMd" color={colors.neutral.white}>
              {activePlace.name}
            </AppText>
          </View>
        )}
        {previewDestinations.map((destination) => {
          const selected = destination.id === selectedDestination?.id;
          return (
            <Pressable
              key={destination.id}
              accessibilityLabel={destination.name}
              accessibilityRole="button"
              onPress={() => onSelectDestination(destination)}
              style={({ pressed }) => [
                styles.destination,
                selected && styles.destinationSelected,
                pressed && styles.destinationPressed,
              ]}
            >
              <AppText
                variant="labelMd"
                color={selected ? colors.neutral.white : colors.brand[700]}
              >
                {destination.name}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.brand[50],
  },
  grid: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.4,
    borderWidth: 32,
    borderColor: colors.brand[100],
    borderRadius: radii['2xl'],
    transform: [{ rotate: '-8deg' }, { scale: 0.84 }],
  },
  copy: {
    alignItems: 'center',
    maxWidth: 320,
    gap: spacing[2],
    padding: spacing[6],
  },
  centered: {
    textAlign: 'center',
  },
  destinationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
  },
  destination: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.white,
  },
  destinationSelected: {
    backgroundColor: colors.brand[600],
  },
  destinationPressed: {
    opacity: 0.72,
  },
});
