import { MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { MapCanvasProps } from './map-canvas';

export function MapCanvas({ destinations, onSelectDestination }: MapCanvasProps) {
  const { t } = useTranslation('screens');

  return (
    <View style={styles.container}>
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
        {destinations.slice(0, 3).map((destination) => (
          <AppText
            key={destination.id}
            accessibilityRole="button"
            onPress={() => onSelectDestination(destination)}
            variant="labelMd"
            color={colors.brand[700]}
            style={styles.destination}
          >
            {destination.name}
          </AppText>
        ))}
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
});
