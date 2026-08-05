import {
  MapPin,
  Navigation,
  TriangleAlert,
  UsersRound,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, iconSizes, radii, spacing } from '@/constants/theme';

import type { HomeMapPreviewProps } from './home-map-preview';

export function HomeMapPreview({ onPress }: HomeMapPreviewProps) {
  const { t } = useTranslation('home');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('travelConditions.mapAccessibility')}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={[styles.road, styles.roadPrimary]} />
      <View style={[styles.road, styles.roadSecondary]} />
      <View style={[styles.crowdArea, styles.crowdAreaPrimary]} />
      <View style={[styles.crowdArea, styles.crowdAreaSecondary]} />
      <View style={[styles.marker, styles.userMarker]}>
        <Navigation size={iconSizes.inline} color={colors.neutral.white} />
      </View>
      <View style={[styles.marker, styles.destinationMarker]}>
        <MapPin size={iconSizes.inline} color={colors.neutral.white} />
      </View>
      <View style={[styles.marker, styles.crowdedMarker]}>
        <UsersRound size={iconSizes.inline} color={colors.semantic.warning.text} />
      </View>
      <View style={[styles.marker, styles.incidentMarker]}>
        <TriangleAlert size={iconSizes.inline} color={colors.neutral.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 172,
    overflow: 'hidden',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    backgroundColor: colors.brand[50],
  },
  pressed: {
    opacity: 0.84,
  },
  road: {
    position: 'absolute',
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.white,
  },
  roadPrimary: {
    top: 74,
    left: -spacing[6],
    width: '125%',
    transform: [{ rotate: '-12deg' }],
  },
  roadSecondary: {
    top: 42,
    right: -spacing[8],
    width: '82%',
    transform: [{ rotate: '51deg' }],
  },
  crowdArea: {
    position: 'absolute',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.semantic.warning.main,
    backgroundColor: colors.semantic.warning.bg,
  },
  crowdAreaPrimary: {
    left: '18%',
    bottom: spacing[5],
    width: 74,
    height: 74,
  },
  crowdAreaSecondary: {
    top: spacing[3],
    right: '12%',
    width: 52,
    height: 52,
  },
  marker: {
    position: 'absolute',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  userMarker: {
    left: '44%',
    bottom: spacing[4],
    backgroundColor: colors.brand[600],
  },
  destinationMarker: {
    top: spacing[4],
    left: '38%',
    backgroundColor: colors.teal[600],
  },
  crowdedMarker: {
    left: '24%',
    bottom: spacing[8],
    backgroundColor: colors.semantic.warning.bg,
  },
  incidentMarker: {
    right: '24%',
    bottom: spacing[6],
    borderRadius: radii.sm,
    backgroundColor: colors.semantic.danger.main,
  },
});
