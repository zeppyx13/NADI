import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, {
  Circle,
  Marker,
  Polyline,
  type Region,
} from 'react-native-maps';
import { MapPin, TriangleAlert, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors, iconSizes, radii, shadows } from '@/constants/theme';
import type { Destination } from '@/types/destination';

export const baliRegion: Region = {
  latitude: -8.4095,
  longitude: 115.1889,
  latitudeDelta: 1.25,
  longitudeDelta: 1.05,
};

export const simulatedStartCoordinate = {
  latitude: -8.6705,
  longitude: 115.2126,
};

export const incidentCoordinate = {
  latitude: -8.6754,
  longitude: 115.2038,
};

export type MapCanvasProps = {
  destinations: readonly Destination[];
  selectedDestination?: Destination;
  showIncident: boolean;
  showCrowdedArea: boolean;
  showRoute: boolean;
  recenterSignal: number;
  locationSignal: number;
  onSelectDestination: (destination: Destination) => void;
};

export function MapCanvas({
  destinations,
  selectedDestination,
  showIncident,
  showCrowdedArea,
  showRoute,
  recenterSignal,
  locationSignal,
  onSelectDestination,
}: MapCanvasProps) {
  const { t } = useTranslation('screens');
  const mapRef = useRef<MapView>(null);
  const routeCoordinates = useMemo(
    () =>
      selectedDestination
        ? [
            simulatedStartCoordinate,
            { latitude: -8.635, longitude: 115.224 },
            { latitude: -8.57, longitude: 115.246 },
            {
              latitude: selectedDestination.latitude,
              longitude: selectedDestination.longitude,
            },
          ]
        : [],
    [selectedDestination],
  );

  useEffect(() => {
    if (recenterSignal > 0) {
      mapRef.current?.animateToRegion(baliRegion, 350);
    }
  }, [recenterSignal]);

  useEffect(() => {
    if (locationSignal > 0) {
      mapRef.current?.animateToRegion(
        {
          ...simulatedStartCoordinate,
          latitudeDelta: 0.18,
          longitudeDelta: 0.18,
        },
        350,
      );
    }
  }, [locationSignal]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={baliRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {showCrowdedArea && (
        <Circle
          center={{ latitude: -8.7185, longitude: 115.1686 }}
          radius={2800}
          fillColor="rgba(228, 81, 76, 0.13)"
          strokeColor={colors.semantic.danger.main}
          strokeWidth={1.5}
        />
      )}

      {destinations.map((destination) => {
        const isSelected = destination.id === selectedDestination?.id;
        const markerColor = colors.occupancy[destination.occupancyLevel];

        return (
          <Marker
            key={destination.id}
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.name}
            description={t('map.destinationMarkerDescription', {
              region: destination.region,
              occupancy: t(`status.occupancy.${destination.occupancyLevel}`),
            })}
            onPress={() => onSelectDestination(destination)}
          >
            <View
              style={[
                styles.destinationMarker,
                { borderColor: markerColor },
                isSelected && styles.destinationMarkerSelected,
              ]}
            >
              <MapPin size={iconSizes.button} color={markerColor} fill={markerColor} />
            </View>
          </Marker>
        );
      })}

      <Marker
        coordinate={simulatedStartCoordinate}
        title={t('map.userMarker')}
        description={t('map.userMarkerDescription')}
      >
        <View style={styles.userMarker}>
          <UserRound size={iconSizes.button} color={colors.neutral.white} />
        </View>
      </Marker>

      {showIncident && (
        <Marker
          coordinate={incidentCoordinate}
          title={t('map.incidentMarker')}
          description={t('map.incidentDescription')}
        >
          <View style={styles.incidentMarker}>
            <TriangleAlert size={iconSizes.button} color={colors.neutral.white} />
          </View>
        </Marker>
      )}

      {showRoute && routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={colors.route.balanced}
          strokeWidth={5}
          lineDashPattern={[1]}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  destinationMarker: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 3,
    backgroundColor: colors.neutral.white,
    ...shadows.sm,
  },
  destinationMarkerSelected: {
    width: 46,
    height: 46,
    borderWidth: 4,
    ...shadows.md,
  },
  userMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[600],
    ...shadows.md,
  },
  incidentMarker: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.semantic.danger.main,
    ...shadows.md,
  },
});
