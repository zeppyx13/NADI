import {
  Camera,
  Map,
  type CameraRef,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  CrowdLayer,
  crowdLayerTopId,
} from '@/components/map/layers/crowd-layer';
import {
  CustomPlaceLayer,
  customPlaceLayerTopId,
} from '@/components/map/layers/custom-place-layer';
import {
  DestinationLayer,
  destinationLayerTopId,
} from '@/components/map/layers/destination-layer';
import {
  IncidentLayer,
  incidentLayerTopId,
} from '@/components/map/layers/incident-layer';
import {
  RouteLayer,
  routeLayerTopId,
} from '@/components/map/layers/route-layer';
import {
  SafetyLayer,
  safetyLayerTopId,
} from '@/components/map/layers/safety-layer';
import { UserLocationLayer } from '@/components/map/layers/user-location-layer';
import {
  baliMapCenter,
  baliMapZoom,
  mapConfig,
  mapFallbackStyle,
  simulatedStartCoordinate,
} from '@/constants/map';
import { spacing } from '@/constants/theme';
import { destinationScenarioConditions } from '@/data/itinerary-scenarios';
import { useMapCamera } from '@/hooks/use-map-camera';
import type { Destination } from '@/types/destination';
import type { ItineraryLocation, ItineraryPlace } from '@/types/itinerary';
import type {
  MapCoordinate,
  MapLayerVisibility,
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
  activePlace?: ItineraryPlace;
  customPlaces?: readonly ItineraryPlace[];
  startLocation?: ItineraryLocation;
  priorityDestinationIds?: readonly string[];
  routeRelevantAlertIds?: readonly string[];
  layerVisibility: MapLayerVisibility;
  showRoute: boolean;
  routeVisualState: MapRouteVisualState;
  recenterSignal: number;
  mapPadding: MapViewportPadding;
  onSelectDestination: (destination: Destination) => void;
  onSelectAlert: (alert: TravelAlert) => void;
};

const emptyPlaces: readonly ItineraryPlace[] = [];
const emptyAlertIds: readonly string[] = [];

function toCoordinate(location: {
  latitude: number;
  longitude: number;
}): MapCoordinate {
  return [location.longitude, location.latitude];
}

export function MapCanvas({
  destinations,
  alerts,
  selectedDestination,
  selectedAlert,
  activePlace,
  customPlaces = emptyPlaces,
  startLocation,
  priorityDestinationIds = [],
  routeRelevantAlertIds = emptyAlertIds,
  layerVisibility,
  showRoute,
  routeVisualState,
  recenterSignal,
  mapPadding,
  onSelectDestination,
  onSelectAlert,
}: MapCanvasProps) {
  const { t } = useTranslation('screens');
  const cameraRef = useRef<CameraRef>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [activeMapStyle, setActiveMapStyle] = useState<
    string | StyleSpecification
  >(mapConfig.style);

  const routeTarget = selectedDestination ?? activePlace;
  const routeOrigin = startLocation ?? simulatedStartCoordinate;
  const routeCoordinates = useMemo<readonly MapCoordinate[]>(() => {
    if (!routeTarget) return [];

    const origin = toCoordinate(routeOrigin);
    const target = toCoordinate(routeTarget);
    return [
      origin,
      [
        origin[0] * 0.67 + target[0] * 0.33,
        origin[1] * 0.67 + target[1] * 0.33,
      ],
      [
        origin[0] * 0.33 + target[0] * 0.67,
        origin[1] * 0.33 + target[1] * 0.67,
      ],
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
    ? toCoordinate(selectedAlert)
    : routeTarget
      ? toCoordinate(routeTarget)
      : undefined;
  const focusKey = selectedAlert
    ? `alert:${selectedAlert.id}`
    : routeTarget
      ? `place:${routeTarget.id}`
      : undefined;
  const cameraRouteCoordinates = useMemo<readonly MapCoordinate[]>(
    () =>
      showRoute && selectedAlert
        ? [...routeCoordinates, toCoordinate(selectedAlert)]
        : routeCoordinates,
    [routeCoordinates, selectedAlert, showRoute],
  );
  const viewportRevision = `${mapPadding.top}:${mapPadding.right}:${mapPadding.bottom}:${mapPadding.left}`;

  const { focusCluster } = useMapCamera({
    cameraRef,
    isMapReady,
    recenterSignal,
    focusKey,
    focusCoordinate,
    routeCoordinates: cameraRouteCoordinates,
    fitRoute: showRoute && routeCoordinates.length > 1,
    viewportRevision,
  });

  const handleDestinationPress = (result: {
    type: 'destination';
    destinationId: string;
  } | {
    type: 'cluster';
    coordinate: MapCoordinate;
    zoom: number;
  }) => {
    if (result.type === 'cluster') {
      focusCluster(result.coordinate, result.zoom);
      return;
    }

    const destination = destinations.find(
      (item) => item.id === result.destinationId,
    );
    if (destination) onSelectDestination(destination);
  };

  const handleAlertPress = (alertId: string) => {
    const alert = alerts.find((item) => item.id === alertId);
    if (alert) onSelectAlert(alert);
  };

  const handleMapLoadFailure = () => {
    if (activeMapStyle === mapFallbackStyle) return;
    setIsMapReady(false);
    setActiveMapStyle(mapFallbackStyle);
  };

  return (
    <Map
      style={StyleSheet.absoluteFill}
      mapStyle={activeMapStyle}
      contentInset={mapPadding}
      androidView="surface"
      compass={false}
      scaleBar={false}
      touchPitch={false}
      accessibilityLabel={t('map.mapAccessibility')}
      attributionPosition={{
        left: spacing[2],
        bottom: mapPadding.bottom + spacing[1],
      }}
      logoPosition={{
        left: spacing[2],
        bottom: mapPadding.bottom + spacing[8],
      }}
      onDidFinishLoadingMap={() => setIsMapReady(true)}
      onDidFailLoadingMap={handleMapLoadFailure}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{
          center: [...baliMapCenter],
          zoom: baliMapZoom,
        }}
      />

      <CrowdLayer
        destinations={destinations}
        visible={layerVisibility.crowd}
      />
      <SafetyLayer
        destinations={destinations}
        conditionsByDestinationId={destinationScenarioConditions}
        afterId={crowdLayerTopId}
        visible={layerVisibility.safety}
      />
      <RouteLayer
        routes={routes}
        afterId={safetyLayerTopId}
        visible={layerVisibility.routes}
      />
      <DestinationLayer
        destinations={destinations}
        selectedDestinationId={selectedDestination?.id}
        priorityDestinationIds={priorityDestinationIds}
        afterId={routeLayerTopId}
        visible={layerVisibility.destinations}
        onPress={handleDestinationPress}
      />
      <IncidentLayer
        alerts={alerts}
        selectedAlertId={selectedAlert?.id}
        routeRelevantAlertIds={routeRelevantAlertIds}
        afterId={destinationLayerTopId}
        visible={layerVisibility.incidents}
        onPress={handleAlertPress}
      />
      <CustomPlaceLayer
        places={customPlaces}
        selectedPlaceId={
          activePlace?.source === 'custom-map-point' ? activePlace.id : undefined
        }
        afterId={incidentLayerTopId}
        visible={layerVisibility.customPlaces}
      />
      <UserLocationLayer
        coordinate={toCoordinate(routeOrigin)}
        afterId={customPlaceLayerTopId}
        visible={layerVisibility.userLocation}
      />
    </Map>
  );
}
