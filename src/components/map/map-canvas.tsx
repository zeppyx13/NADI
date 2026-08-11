import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { CrowdLayer } from '@/components/map/layers/crowd-layer';
import { CustomPlaceLayer } from '@/components/map/layers/custom-place-layer';
import { DestinationLayer } from '@/components/map/layers/destination-layer';
import { IncidentLayer } from '@/components/map/layers/incident-layer';
import { MonitoringLayer } from '@/components/map/layers/monitoring-layer';
import { ParkingLayer } from '@/components/map/layers/parking-layer';
import { RouteLayer } from '@/components/map/layers/route-layer';
import { SafetyLayer } from '@/components/map/layers/safety-layer';
import { TrafficLayer } from '@/components/map/layers/traffic-layer';
import { UserLocationLayer } from '@/components/map/layers/user-location-layer';
import {
  baliRegion,
  cleanMapStyle,
  simulatedStartCoordinate,
} from '@/constants/map';
import { colors, radii } from '@/constants/theme';
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
import type {
  DestinationCrowd,
  MapIncident,
  MonitoringPoint,
  ParkingArea,
  SafetyZone,
  TrafficSegment,
} from '@/types/map-intelligence';

export type MapCanvasProps = {
  destinations: readonly Destination[];
  selectedDestination?: Destination;
  /** Google Places result currently pinned on the map. */
  selectedPlace?: MapPlaceResult;
  activePlace?: ItineraryPlace;
  customPlaces?: readonly ItineraryPlace[];
  startLocation?: ItineraryLocation;
  currentLocation?: MapLatLng;
  priorityDestinationIds?: readonly string[];

  trafficSegments: readonly TrafficSegment[];
  monitoringPoints: readonly MonitoringPoint[];
  incidents: readonly MapIncident[];
  destinationCrowd: readonly DestinationCrowd[];
  safetyZones: readonly SafetyZone[];
  parkingAreas: readonly ParkingArea[];

  selectedIncident?: MapIncident;
  selectedMonitoringPoint?: MonitoringPoint;
  routeRelevantIncidentIds?: readonly string[];

  layerVisibility: MapLayerVisibility;
  showRoute: boolean;
  routeVisualState: MapRouteVisualState;
  recenterSignal: number;
  mapPadding: MapViewportPadding;
  onSelectDestination: (destination: Destination) => void;
  onSelectIncident: (incidentId: string) => void;
  onSelectMonitoringPoint: (pointId: string) => void;
  /** Fired for taps on the basemap itself, not on a marker. */
  onMapPress?: () => void;
};

const emptyPlaces: readonly ItineraryPlace[] = [];
const emptyIncidentIds: readonly string[] = [];

function toLatLng(location: MapLatLng): MapLatLng {
  return { latitude: location.latitude, longitude: location.longitude };
}

export function MapCanvas({
  destinations,
  selectedDestination,
  selectedPlace,
  activePlace,
  customPlaces = emptyPlaces,
  startLocation,
  currentLocation,
  priorityDestinationIds = [],
  trafficSegments,
  monitoringPoints,
  incidents,
  destinationCrowd,
  safetyZones,
  parkingAreas,
  selectedIncident,
  selectedMonitoringPoint,
  routeRelevantIncidentIds = emptyIncidentIds,
  layerVisibility,
  showRoute,
  routeVisualState,
  recenterSignal,
  mapPadding,
  onSelectDestination,
  onSelectIncident,
  onSelectMonitoringPoint,
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

  const focusTarget = selectedIncident
    ? { key: `incident:${selectedIncident.id}`, coordinate: toLatLng(selectedIncident) }
    : selectedMonitoringPoint
      ? {
          key: `monitoring:${selectedMonitoringPoint.id}`,
          coordinate: toLatLng(selectedMonitoringPoint),
        }
      : selectedPlace
        ? { key: `place:${selectedPlace.id}`, coordinate: toLatLng(selectedPlace) }
        : routeTarget
          ? {
              key: `destination:${routeTarget.id}`,
              coordinate: toLatLng(routeTarget),
            }
          : undefined;
  const cameraRouteCoordinates = useMemo<readonly MapLatLng[]>(
    () =>
      showRoute && selectedIncident
        ? [...routeCoordinates, toLatLng(selectedIncident)]
        : routeCoordinates,
    [routeCoordinates, selectedIncident, showRoute],
  );
  const viewportRevision = `${mapPadding.top}:${mapPadding.right}:${mapPadding.bottom}:${mapPadding.left}`;

  const { focusRegion } = useMapCamera({
    mapRef,
    isMapReady,
    recenterSignal,
    recenterTarget: currentLocation,
    focusKey: focusTarget?.key,
    focusCoordinate: focusTarget?.coordinate,
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

  const handleMonitoringCluster = useCallback(
    (clusterRegion: MapRegion) => focusRegion(clusterRegion),
    [focusRegion],
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
      <CrowdLayer
        crowd={destinationCrowd}
        destinations={destinations}
        visible={layerVisibility.crowd}
      />
      <SafetyLayer zones={safetyZones} visible={layerVisibility.safety} />
      <TrafficLayer
        segments={trafficSegments}
        visible={layerVisibility.traffic}
      />
      <RouteLayer routes={routes} visible={layerVisibility.routes} />
      <ParkingLayer areas={parkingAreas} visible={layerVisibility.parking} />
      <DestinationLayer
        destinations={destinations}
        region={region}
        selectedDestinationId={selectedDestination?.id}
        priorityDestinationIds={priorityDestinationIds}
        visible={layerVisibility.destinations}
        onPress={handleDestinationPress}
      />
      <MonitoringLayer
        points={monitoringPoints}
        region={region}
        selectedPointId={selectedMonitoringPoint?.id}
        visible={layerVisibility.cctvAtcs}
        onPressPoint={onSelectMonitoringPoint}
        onPressCluster={handleMonitoringCluster}
      />
      <IncidentLayer
        incidents={incidents}
        selectedIncidentId={selectedIncident?.id}
        routeRelevantIncidentIds={routeRelevantIncidentIds}
        visible={layerVisibility.incidents}
        onPress={onSelectIncident}
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
          zIndex={10}
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
