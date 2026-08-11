import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { CrowdLayer } from '@/components/map/layers/crowd-layer';
import { CustomPlaceLayer } from '@/components/map/layers/custom-place-layer';
import { DestinationLayer } from '@/components/map/layers/destination-layer';
import { IncidentLayer } from '@/components/map/layers/incident-layer';
import { RouteLayer } from '@/components/map/layers/route-layer';
import { SafetyLayer } from '@/components/map/layers/safety-layer';
import { UserLocationLayer } from '@/components/map/layers/user-location-layer';
import {
  baliRegion,
  cleanMapStyle,
  simulatedStartCoordinate,
} from '@/constants/map';
import { colors, radii } from '@/constants/theme';
import { destinationScenarioConditions } from '@/data/itinerary-scenarios';
import { useMapCamera } from '@/hooks/use-map-camera';
import type { Destination } from '@/types/destination';
import type { ItineraryLocation, ItineraryPlace } from '@/types/itinerary';
import type {
  MapDestinationPressResult,
  MapLatLng,
  MapLayerVisibility,
  MapPlaceResult,
  MapRegion,
  MapRouteLine,
  MapRouteVisualState,
  MapViewportPadding,
} from '@/types/map';
import type { TravelAlert } from '@/types/travel-alert';

export type MapCanvasProps = {
  destinations: readonly Destination[];
  alerts: readonly TravelAlert[];
  selectedDestination?: Destination;
  selectedAlert?: TravelAlert;
  /** Google Places result currently pinned on the map. */
  selectedPlace?: MapPlaceResult;
  activePlace?: ItineraryPlace;
  customPlaces?: readonly ItineraryPlace[];
  startLocation?: ItineraryLocation;
  currentLocation?: MapLatLng;
  priorityDestinationIds?: readonly string[];
  routeRelevantAlertIds?: readonly string[];
  layerVisibility: MapLayerVisibility;
  showRoute: boolean;
  routeVisualState: MapRouteVisualState;
  recenterSignal: number;
  mapPadding: MapViewportPadding;
  onSelectDestination: (destination: Destination) => void;
  onSelectAlert: (alert: TravelAlert) => void;
  /** Fired for taps on the basemap itself, not on a marker. */
  onMapPress?: () => void;
};

const emptyPlaces: readonly ItineraryPlace[] = [];
const emptyAlertIds: readonly string[] = [];

function toLatLng(location: MapLatLng): MapLatLng {
  return { latitude: location.latitude, longitude: location.longitude };
}

export function MapCanvas({
  destinations,
  alerts,
  selectedDestination,
  selectedAlert,
  selectedPlace,
  activePlace,
  customPlaces = emptyPlaces,
  startLocation,
  currentLocation,
  priorityDestinationIds = [],
  routeRelevantAlertIds = emptyAlertIds,
  layerVisibility,
  showRoute,
  routeVisualState,
  recenterSignal,
  mapPadding,
  onSelectDestination,
  onSelectAlert,
  onMapPress,
}: MapCanvasProps) {
  const { t } = useTranslation('screens');
  const mapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [region, setRegion] = useState<MapRegion>(baliRegion);

  const routeOrigin = currentLocation ?? startLocation ?? simulatedStartCoordinate;
  const routeTarget = selectedDestination ?? activePlace;

  /**
   * Local placeholder geometry. Real Google routing arrives in a later phase;
   * this only keeps the existing itinerary preview visible after the migration.
   */
  const routeCoordinates = useMemo<readonly MapLatLng[]>(() => {
    if (!routeTarget) return [];
    const origin = toLatLng(routeOrigin);
    const target = toLatLng(routeTarget);
    return [
      origin,
      {
        latitude: origin.latitude * 0.67 + target.latitude * 0.33,
        longitude: origin.longitude * 0.67 + target.longitude * 0.33,
      },
      {
        latitude: origin.latitude * 0.33 + target.latitude * 0.67,
        longitude: origin.longitude * 0.33 + target.longitude * 0.67,
      },
      target,
    ];
  }, [routeOrigin, routeTarget]);

  const routes = useMemo<readonly MapRouteLine[]>(
    () =>
      showRoute && routeCoordinates.length > 1
        ? [
            {
              id: 'nadi-current-route',
              coordinates: routeCoordinates,
              visualState: routeVisualState,
            },
          ]
        : [],
    [routeCoordinates, routeVisualState, showRoute],
  );

  const focusCoordinate = selectedAlert
    ? toLatLng(selectedAlert)
    : selectedPlace
      ? toLatLng(selectedPlace)
      : routeTarget
        ? toLatLng(routeTarget)
        : undefined;
  const focusKey = selectedAlert
    ? `alert:${selectedAlert.id}`
    : selectedPlace
      ? `place:${selectedPlace.id}`
      : routeTarget
        ? `destination:${routeTarget.id}`
        : undefined;
  const cameraRouteCoordinates = useMemo<readonly MapLatLng[]>(
    () =>
      showRoute && selectedAlert
        ? [...routeCoordinates, toLatLng(selectedAlert)]
        : routeCoordinates,
    [routeCoordinates, selectedAlert, showRoute],
  );
  const viewportRevision = `${mapPadding.top}:${mapPadding.right}:${mapPadding.bottom}:${mapPadding.left}`;

  const { focusRegion } = useMapCamera({
    mapRef,
    isMapReady,
    recenterSignal,
    recenterTarget: currentLocation,
    focusKey,
    focusCoordinate,
    routeCoordinates: cameraRouteCoordinates,
    fitRoute: showRoute && routeCoordinates.length > 1,
    viewportRevision,
  });

  const handleDestinationPress = useCallback(
    (result: MapDestinationPressResult) => {
      if (result.type === 'cluster') {
        focusRegion(result.region);
        return;
      }
      const destination = destinations.find(
        (item) => item.id === result.destinationId,
      );
      if (destination) onSelectDestination(destination);
    },
    [destinations, focusRegion, onSelectDestination],
  );

  const handleAlertPress = useCallback(
    (alertId: string) => {
      const alert = alerts.find((item) => item.id === alertId);
      if (alert) onSelectAlert(alert);
    },
    [alerts, onSelectAlert],
  );

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFill}
      initialRegion={baliRegion}
      customMapStyle={[...cleanMapStyle]}
      mapPadding={mapPadding}
      showsCompass={false}
      showsMyLocationButton={false}
      showsUserLocation={false}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      accessibilityLabel={t('map.mapAccessibility')}
      onMapReady={() => setIsMapReady(true)}
      onRegionChangeComplete={setRegion}
      onPress={onMapPress ? () => onMapPress() : undefined}
    >
      <CrowdLayer destinations={destinations} visible={layerVisibility.crowd} />
      <SafetyLayer
        destinations={destinations}
        conditionsByDestinationId={destinationScenarioConditions}
        visible={layerVisibility.safety}
      />
      <RouteLayer routes={routes} visible={layerVisibility.routes} />
      <DestinationLayer
        destinations={destinations}
        region={region}
        selectedDestinationId={selectedDestination?.id}
        priorityDestinationIds={priorityDestinationIds}
        visible={layerVisibility.destinations}
        onPress={handleDestinationPress}
      />
      <IncidentLayer
        alerts={alerts}
        selectedAlertId={selectedAlert?.id}
        routeRelevantAlertIds={routeRelevantAlertIds}
        visible={layerVisibility.incidents}
        onPress={handleAlertPress}
      />
      <CustomPlaceLayer
        places={customPlaces}
        selectedPlaceId={
          activePlace?.source === 'custom-map-point' ? activePlace.id : undefined
        }
        visible={layerVisibility.itineraryStops}
      />
      <UserLocationLayer
        coordinate={toLatLng(routeOrigin)}
        isDeviceLocation={Boolean(currentLocation)}
        visible={layerVisibility.userLocation}
      />

      {selectedPlace && (
        <Marker
          identifier={selectedPlace.id}
          coordinate={toLatLng(selectedPlace)}
          tracksViewChanges={false}
          zIndex={7}
          accessibilityLabel={selectedPlace.name}
        >
          <View style={styles.placeMarker} />
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  placeMarker: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    borderWidth: 4,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[700],
  },
});
