import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { CrowdLayer } from '@/components/map/layers/crowd-layer';
import { DestinationLayer } from '@/components/map/layers/destination-layer';
import { IncidentLayer } from '@/components/map/layers/incident-layer';
import { ItineraryStopLayer } from '@/components/map/layers/itinerary-stop-layer';
import { MonitoringLayer } from '@/components/map/layers/monitoring-layer';
import { ParkingLayer } from '@/components/map/layers/parking-layer';
import { RouteLayer } from '@/components/map/layers/route-layer';
import { SafetyLayer } from '@/components/map/layers/safety-layer';
import { TrafficLayer } from '@/components/map/layers/traffic-layer';
import { UserLocationLayer } from '@/components/map/layers/user-location-layer';
import {
  baliRegion,
  cleanMapStyle,
  mapClusterGridSize,
  simulatedStartCoordinate,
} from '@/constants/map';
import { colors, radii } from '@/constants/theme';
import { useMapCamera } from '@/hooks/use-map-camera';
import type { Destination } from '@/types/destination';
import type {
  ItineraryLocation,
  ItineraryPlace,
  ItineraryStop,
} from '@/types/itinerary';
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
import type { ScoredRoute } from '@/types/route';

export type MapCanvasProps = {
  destinations: readonly Destination[];
  selectedDestination?: Destination;
  /** Google Places result currently pinned on the map. */
  selectedPlace?: MapPlaceResult;
  activePlace?: ItineraryPlace;
  itineraryStops?: readonly ItineraryStop[];
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

  /** Scored candidates for the current preview or leg, already ordered. */
  routeCandidates?: readonly ScoredRoute[];
  selectedRouteId?: string;

  layerVisibility: MapLayerVisibility;
  showRoute: boolean;
  routeVisualState: MapRouteVisualState;
  recenterSignal: number;
  mapPadding: MapViewportPadding;
  onSelectDestination: (destination: Destination) => void;
  onSelectIncident: (incidentId: string) => void;
  onSelectMonitoringPoint: (pointId: string) => void;
  /** Fired for taps on empty basemap, carrying the tapped coordinate. */
  onMapPress?: (coordinate: MapLatLng) => void;
  /** Fired when the user taps a Google point of interest. */
  onPoiPress?: (poi: {
    placeId: string;
    name: string;
    coordinate: MapLatLng;
  }) => void;
  /** Temporary pin for a coordinate the user dropped. */
  droppedPin?: MapLatLng;
};

const emptyStops: readonly ItineraryStop[] = [];
const emptyRoutes: readonly ScoredRoute[] = [];
const emptyIncidentIds: readonly string[] = [];

function toLatLng(location: MapLatLng): MapLatLng {
  return { latitude: location.latitude, longitude: location.longitude };
}

function MapCanvasComponent({
  destinations,
  selectedDestination,
  selectedPlace,
  activePlace,
  itineraryStops = emptyStops,
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
  routeCandidates = emptyRoutes,
  selectedRouteId,
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
  onPoiPress,
  droppedPin,
}: MapCanvasProps) {
  const { t } = useTranslation('screens');
  const mapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [region, setRegion] = useState<MapRegion>(baliRegion);

  /**
   * `onRegionChangeComplete` fires for every pan and pinch. Clustering only
   * cares about roughly where and how far out the map sits, so the region is
   * snapped to a coarse grid before it becomes state. Without this a nudge of
   * the map re-rendered every layer, including the traffic corridors.
   */
  const handleRegionChange = useCallback((next: MapRegion) => {
    setRegion((current) => {
      const step = Math.max(next.longitudeDelta / mapClusterGridSize, 1e-4);
      const snap = (value: number) => Math.round(value / step) * step;
      const isSameZoom =
        Math.abs(next.longitudeDelta - current.longitudeDelta) <
        current.longitudeDelta * 0.2;
      const isSameCell =
        snap(next.latitude) === snap(current.latitude) &&
        snap(next.longitude) === snap(current.longitude);
      return isSameZoom && isSameCell ? current : next;
    });
  }, []);

  const routeOrigin = currentLocation ?? startLocation ?? simulatedStartCoordinate;
  const routeTarget = selectedDestination ?? activePlace;

  const selectedCandidate = useMemo(
    () =>
      routeCandidates.find((route) => route.candidate.id === selectedRouteId) ??
      routeCandidates[0],
    [routeCandidates, selectedRouteId],
  );

  /** Selected route drawn on top; the remaining candidates stay as alternatives. */
  const routes = useMemo<readonly MapRouteLine[]>(() => {
    if (!showRoute || routeCandidates.length === 0) return [];
    return routeCandidates.map((route) => ({
      id: route.candidate.id,
      coordinates: route.candidate.geometry,
      visualState:
        route.candidate.id === selectedCandidate?.candidate.id
          ? routeVisualState
          : 'alternative',
    }));
  }, [routeCandidates, routeVisualState, selectedCandidate, showRoute]);

  const routeCoordinates = useMemo<readonly MapLatLng[]>(
    () => selectedCandidate?.candidate.geometry ?? [],
    [selectedCandidate],
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
      // Google's own traffic for the whole road network, tied to the filter.
      showsTraffic={layerVisibility.traffic}
      toolbarEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      accessibilityLabel={t('map.mapAccessibility')}
      onMapReady={() => setIsMapReady(true)}
      onRegionChangeComplete={handleRegionChange}
      onPress={
        onMapPress
          ? (event) => {
              // Android reports a marker tap through the map's own onPress as
              // well. Without this guard, tapping a CCTV or incident marker
              // dropped a pin and cancelled the selection the marker had just
              // made.
              if (event.nativeEvent.action === 'marker-press') return;
              onMapPress(event.nativeEvent.coordinate);
            }
          : undefined
      }
      onPoiClick={
        onPoiPress
          ? (event) =>
            onPoiPress({
              placeId: event.nativeEvent.placeId,
              name: event.nativeEvent.name,
              coordinate: event.nativeEvent.coordinate,
            })
          : undefined
      }
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
      <ItineraryStopLayer
        stops={itineraryStops}
        startLocation={startLocation}
        visible={layerVisibility.itineraryStops}
      />
      <UserLocationLayer
        coordinate={toLatLng(routeOrigin)}
        isDeviceLocation={Boolean(currentLocation)}
        visible={layerVisibility.userLocation}
      />

      {droppedPin && (
        <Marker
          identifier="nadi-dropped-pin"
          coordinate={droppedPin}
          tracksViewChanges={false}
          zIndex={11}
          accessibilityLabel={t('map.droppedPinAccessibility')}
        >
          <View style={styles.droppedPin} />
        </Marker>
      )}

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
  droppedPin: {
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    borderWidth: 4,
    borderColor: colors.neutral.white,
    backgroundColor: colors.neutral.navy,
  },
  placeMarker: {
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    borderWidth: 4,
    borderColor: colors.neutral.white,
    backgroundColor: colors.brand[700],
  },
});

/**
 * Memoised because the screen above it re-renders for panel state, journey
 * ticks and search input, none of which change what the map draws.
 */
export const MapCanvas = memo(MapCanvasComponent);
