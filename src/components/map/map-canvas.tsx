import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, {
  Circle,
  Marker,
  Polyline,
  type EdgePadding,
  type Region,
} from 'react-native-maps';
import { MapPin, TriangleAlert, UserRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import {
  colors,
  iconSizes,
  radii,
  shadows,
  type RouteMode,
} from '@/constants/theme';
import type { Destination } from '@/types/destination';
import type { ItineraryLocation, ItineraryPlace } from '@/types/itinerary';

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
  activePlace?: ItineraryPlace;
  startLocation?: ItineraryLocation;
  priorityDestinationIds?: readonly string[];
  showIncident: boolean;
  showCrowdedArea: boolean;
  showRoute: boolean;
  routeMode: RouteMode;
  recenterSignal: number;
  mapPadding: EdgePadding;
  onSelectDestination: (destination: Destination) => void;
};

const detailedRegionThreshold = 0.58;

function isInsideRegion(destination: Destination, region: Region): boolean {
  const latitudeMargin = region.latitudeDelta * 0.58;
  const longitudeMargin = region.longitudeDelta * 0.58;
  return (
    Math.abs(destination.latitude - region.latitude) <= latitudeMargin &&
    Math.abs(destination.longitude - region.longitude) <= longitudeMargin
  );
}

export function MapCanvas({
  destinations,
  selectedDestination,
  activePlace,
  startLocation,
  priorityDestinationIds = [],
  showIncident,
  showCrowdedArea,
  showRoute,
  routeMode,
  recenterSignal,
  mapPadding,
  onSelectDestination,
}: MapCanvasProps) {
  const { t } = useTranslation('screens');
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(baliRegion);
  const [isMapReady, setIsMapReady] = useState(false);
  const priorityIds = useMemo(
    () => new Set(priorityDestinationIds),
    [priorityDestinationIds],
  );
  const routeTarget = selectedDestination ?? activePlace;
  const routeOrigin = startLocation ?? simulatedStartCoordinate;
  const routeCoordinates = useMemo(
    () =>
      routeTarget
        ? [
            routeOrigin,
            {
              latitude: routeOrigin.latitude * 0.67 + routeTarget.latitude * 0.33,
              longitude: routeOrigin.longitude * 0.67 + routeTarget.longitude * 0.33,
            },
            {
              latitude: routeOrigin.latitude * 0.33 + routeTarget.latitude * 0.67,
              longitude: routeOrigin.longitude * 0.33 + routeTarget.longitude * 0.67,
            },
            {
              latitude: routeTarget.latitude,
              longitude: routeTarget.longitude,
            },
          ]
        : [],
    [routeOrigin, routeTarget],
  );
  const renderedDestinations = useMemo(() => {
    const showViewportDestinations =
      region.latitudeDelta <= detailedRegionThreshold;

    return destinations.filter((destination) => {
      const isSelected = destination.id === selectedDestination?.id;
      const isPriority = priorityIds.has(destination.id);
      if (isSelected || isPriority) return true;
      if (!showViewportDestinations) {
        return destination.intelligenceCoverage === 'pilot';
      }
      return isInsideRegion(destination, region);
    });
  }, [destinations, priorityIds, region, selectedDestination?.id]);

  useEffect(() => {
    if (recenterSignal <= 0 || !isMapReady) return;

    if (showRoute && routeCoordinates.length > 0) {
      mapRef.current?.fitToCoordinates(routeCoordinates, {
        animated: true,
        edgePadding: mapPadding,
      });
      return;
    }

    if (routeTarget) {
      mapRef.current?.animateToRegion(
        {
          latitude: routeTarget.latitude,
          longitude: routeTarget.longitude,
          latitudeDelta: 0.24,
          longitudeDelta: 0.2,
        },
        350,
      );
      return;
    }

    mapRef.current?.animateToRegion(baliRegion, 350);
  }, [
    isMapReady,
    mapPadding,
    recenterSignal,
    routeCoordinates,
    routeTarget,
    showRoute,
  ]);

  useEffect(() => {
    if (!isMapReady || !showRoute || routeCoordinates.length === 0) return;
    mapRef.current?.fitToCoordinates(routeCoordinates, {
      animated: true,
      edgePadding: mapPadding,
    });
  }, [isMapReady, mapPadding, routeCoordinates, showRoute]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={baliRegion}
      mapPadding={mapPadding}
      paddingAdjustmentBehavior="never"
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      onMapReady={() => setIsMapReady(true)}
      onRegionChangeComplete={setRegion}
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

      {renderedDestinations.map((destination) => {
        const isSelected = destination.id === selectedDestination?.id;
        const markerColor = destination.occupancyLevel
          ? colors.occupancy[destination.occupancyLevel]
          : colors.brand[600];
        const markerDescription = destination.occupancyLevel
          ? t('map.destinationMarkerDescription', {
              region: destination.region,
              occupancy: t(`status.occupancy.${destination.occupancyLevel}`),
            })
          : destination.region;

        return (
          <Marker
            key={destination.id}
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.name}
            description={markerDescription}
            zIndex={
              isSelected
                ? 10
                : destination.intelligenceCoverage === 'pilot'
                  ? 5
                  : 1
            }
            onPress={() => onSelectDestination(destination)}
          >
            <View
              style={[
                styles.destinationMarker,
                { borderColor: markerColor },
                isSelected && styles.destinationMarkerSelected,
              ]}
            >
              <MapPin
                size={iconSizes.button}
                color={markerColor}
                fill={markerColor}
              />
            </View>
          </Marker>
        );
      })}

      {activePlace?.source === 'custom-map-point' && (
        <Marker
          coordinate={{
            latitude: activePlace.latitude,
            longitude: activePlace.longitude,
          }}
          title={activePlace.name}
          zIndex={8}
        >
          <View style={styles.customPlaceMarker}>
            <MapPin size={iconSizes.button} color={colors.neutral.white} />
          </View>
        </Marker>
      )}

      <Marker
        coordinate={routeOrigin}
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
          strokeColor={colors.route[routeMode]}
          strokeWidth={5}
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
  customPlaceMarker: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: colors.neutral.white,
    backgroundColor: colors.teal[600],
    ...shadows.md,
  },
});
