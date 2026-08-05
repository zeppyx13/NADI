import {
  MapPin,
  Navigation,
  TriangleAlert,
  UsersRound,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useTranslation } from 'react-i18next';

import { colors, iconSizes, radii, shadows, spacing } from '@/constants/theme';
import { destinations } from '@/data/destinations';
import {
  baliRegion,
  incidentCoordinate,
  simulatedStartCoordinate,
} from '@/components/map/map-canvas';

export type HomeMapPreviewProps = {
  onPress: () => void;
};

const previewDestination = destinations.find((item) => item.id === 'ubud');
const secondCrowdedArea = {
  latitude: -8.6904,
  longitude: 115.1742,
};

export function HomeMapPreview({ onPress }: HomeMapPreviewProps) {
  const { t } = useTranslation('home');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('travelConditions.mapAccessibility')}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <MapView
        initialRegion={baliRegion}
        pitchEnabled={false}
        rotateEnabled={false}
        scrollEnabled={false}
        zoomEnabled={false}
        toolbarEnabled={false}
        showsCompass={false}
        showsMyLocationButton={false}
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <Circle
          center={{ latitude: -8.7185, longitude: 115.1686 }}
          radius={6_500}
          fillColor={`${colors.semantic.warning.main}30`}
          strokeColor={colors.semantic.warning.main}
          strokeWidth={1.5}
        />
        <Circle
          center={secondCrowdedArea}
          radius={4_200}
          fillColor={`${colors.semantic.warning.main}24`}
          strokeColor={colors.semantic.warning.main}
          strokeWidth={1.5}
        />

        <Marker coordinate={simulatedStartCoordinate} title={t('travelConditions.userMarker')}>
          <View style={[styles.marker, styles.userMarker]}>
            <Navigation size={iconSizes.inline} color={colors.neutral.white} />
          </View>
        </Marker>

        {previewDestination && (
          <Marker
            coordinate={{
              latitude: previewDestination.latitude,
              longitude: previewDestination.longitude,
            }}
            title={t('travelConditions.destinationMarker')}
          >
            <View style={[styles.marker, styles.destinationMarker]}>
              <MapPin size={iconSizes.inline} color={colors.neutral.white} />
            </View>
          </Marker>
        )}

        <Marker
          coordinate={{ latitude: -8.7185, longitude: 115.1686 }}
          title={t('travelConditions.crowdedMarker')}
        >
          <View style={[styles.marker, styles.crowdedMarker]}>
            <UsersRound size={iconSizes.inline} color={colors.semantic.warning.text} />
          </View>
        </Marker>

        <Marker coordinate={incidentCoordinate} title={t('travelConditions.incidentMarker')}>
          <View style={[styles.marker, styles.incidentMarker]}>
            <TriangleAlert size={iconSizes.inline} color={colors.neutral.white} />
          </View>
        </Marker>
      </MapView>
      <View pointerEvents="none" style={styles.openHint}>
        <MapPin size={iconSizes.inline} color={colors.brand[700]} />
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
  marker: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.white,
    ...shadows.sm,
  },
  userMarker: {
    backgroundColor: colors.brand[600],
  },
  destinationMarker: {
    backgroundColor: colors.teal[600],
  },
  crowdedMarker: {
    backgroundColor: colors.semantic.warning.bg,
  },
  incidentMarker: {
    borderRadius: radii.sm,
    backgroundColor: colors.semantic.danger.main,
  },
  openHint: {
    position: 'absolute',
    right: spacing[3],
    bottom: spacing[3],
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.white,
    ...shadows.sm,
  },
});
