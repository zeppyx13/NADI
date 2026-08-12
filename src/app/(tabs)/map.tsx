import { useLocalSearchParams, useRouter } from 'expo-router';
import { Layers3, LocateFixed, SlidersHorizontal } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ActiveJourneyPanel } from '@/components/map/active-journey-panel';
import { DestinationDetailPanel } from '@/components/map/destination-detail-panel';
import { DroppedPinPanel } from '@/components/map/dropped-pin-panel';
import { IncidentDetailPanel } from '@/components/map/incident-detail-panel';
import { MapCanvas } from '@/components/map/map-canvas';
import { MapFilterSheet } from '@/components/map/map-filter-sheet';
import { MapSearchBar } from '@/components/map/map-search-bar';
import { MonitoringDetailPanel } from '@/components/map/monitoring-detail-panel';
import { MonitoringPlaybackModal } from '@/components/map/monitoring-playback-modal';
import { PlaceDetailPanel } from '@/components/map/place-detail-panel';
import { ReoptimizationBanner } from '@/components/map/reoptimization-banner';
import { RoutePreviewPanel } from '@/components/map/route-preview-panel';
import { AppText, IconButton } from '@/components/ui';
import {
  colors,
  iconSizes,
  layout,
  radii,
  shadows,
  spacing,
  type RouteMode,
} from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import { travelAlerts } from '@/data/alerts';
import { destinations } from '@/data/destinations';
import {
  defaultItineraryStartLocation,
  getTravelMinutesBetween,
} from '@/data/itinerary-scenarios';
import { useIncentive } from '@/context/incentive-context';
import { useCurrentLocation } from '@/hooks/use-current-location';
import { useDestinationCondition } from '@/hooks/use-destination-condition';
import { useJourneyRuntime } from '@/hooks/use-journey-runtime';
import { useMapIntelligence } from '@/hooks/use-map-intelligence';
import { useMapLayerVisibility } from '@/hooks/use-map-layer-visibility';
import { usePlaceSearch } from '@/hooks/use-place-search';
import { useRoutePreview } from '@/hooks/use-route-preview';
import type { Destination } from '@/types/destination';
import type {
  MapInteractionMode,
  MapLatLng,
  MapLayerVisibility,
  MapPlaceResult,
  MapRouteVisualState,
} from '@/types/map';
import type { RouteEndpoint } from '@/types/route';
import {
  isEventNearNextItineraryLeg,
  isEventRelevantToItinerary,
  isRouteDisruptionAlert,
} from '@/utils/itinerary';

export default function MapScreen() {
  const { t } = useTranslation(['screens', 'itinerary']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeItinerary,
    itineraries,
    getItinerary,
    reanalyzeRemainingStops,
    start,
    completeCurrentStop,
  } = useItineraries();
  const params = useLocalSearchParams<{
    destinationId?: string;
    alertId?: string;
    itineraryId?: string;
  }>();
  const search = usePlaceSearch();
  const { layerVisibility, toggleLayer, hasCustomLayers } =
    useMapLayerVisibility();
  const currentLocation = useCurrentLocation();
  const intelligence = useMapIntelligence();
  const { recordActivity } = useIncentive();
  const [mode, setMode] = useState<MapInteractionMode>('explore');
  const [selectedDestination, setSelectedDestination] = useState<Destination>();
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceResult>();
  const [isPlaceRouteRequested, setIsPlaceRouteRequested] = useState(false);
  /** Coordinate the user dropped by tapping empty map. */
  const [droppedPin, setDroppedPin] = useState<MapLatLng>();
  /** Origin the user chose explicitly; overrides the fallback chain. */
  const [explicitOrigin, setExplicitOrigin] = useState<RouteEndpoint>();
  const [routeTargetEndpointOverride, setRouteTargetEndpointOverride] =
    useState<RouteEndpoint>();
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>();
  const [selectedMonitoringId, setSelectedMonitoringId] = useState<string>();
  const [isPlaybackOpen, setIsPlaybackOpen] = useState(false);
  const [journeyNotice, setJourneyNotice] = useState<string | null>(null);
  const [routeModeOverride, setRouteModeOverride] = useState<RouteMode | null>(
    null,
  );
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const requestedReanalysis = useRef<string | null>(null);
  /**
   * iOS delivers a marker tap and a map tap back to back without the
   * `marker-press` action Android provides, so the map tap is ignored for a
   * moment after any marker selection.
   */
  const lastMarkerPressAt = useRef(0);
  const itinerarySessionKeyRef = useRef<string | null>(null);

  const requestedItinerary = params.itineraryId
    ? getItinerary(params.itineraryId)
    : null;
  const mapItinerary =
    requestedItinerary?.status === 'active' ? requestedItinerary : activeItinerary;
  const itineraryPlan = mapItinerary?.approvedPlan ?? null;
  const itineraryStops = useMemo(
    () => itineraryPlan?.stops ?? [],
    [itineraryPlan],
  );
  const remainingStops = useMemo(
    () =>
      itineraryStops.filter(
        (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
      ),
    [itineraryStops],
  );
  const currentStop = remainingStops[0];
  const currentStopIndex = currentStop
    ? itineraryStops.findIndex((stop) => stop.id === currentStop.id)
    : -1;
  const previousCompletedStop =
    currentStopIndex > 0
      ? [...itineraryStops.slice(0, currentStopIndex)]
          .reverse()
          .find((stop) => stop.status === 'completed')
      : undefined;
  const routeOriginLocation =
    previousCompletedStop?.place ??
    mapItinerary?.startLocation ??
    defaultItineraryStartLocation;
  const itineraryDestination = destinations.find(
    (item) => item.id === currentStop?.destinationId,
  );
  const activeItineraryPlace = currentStop?.place;
  const journey = useJourneyRuntime(mapItinerary);

  /** The traveller arrived here from an itinerary, asking to follow it. */
  const isJourneyRequested = Boolean(params.itineraryId);
  const selectedAlert = travelAlerts.find((alert) => alert.id === params.alertId);
  // The alert feed deep-links by alert id; the map speaks in incidents.
  const linkedIncident = params.alertId
    ? intelligence.incidents.find(
        (incident) => incident.alertId === params.alertId,
      )
    : undefined;
  /** Crowd alerts have no road incident, so they land on their destination. */
  const alertDestination =
    !linkedIncident && selectedAlert?.destinationId
      ? destinations.find((item) => item.id === selectedAlert.destinationId)
      : undefined;

  const parameterDestination = destinations.find(
    (item) => item.id === params.destinationId,
  );
  const displayedDestination = params.alertId
    ? alertDestination ?? itineraryDestination
    : parameterDestination ?? selectedDestination ?? itineraryDestination;
  const selectedIncident =
    linkedIncident ??
    intelligence.incidents.find((incident) => incident.id === selectedIncidentId);
  const selectedMonitoringPoint = intelligence.monitoringPoints.find(
    (point) => point.id === selectedMonitoringId,
  );

  const routeMode =
    routeModeOverride ?? mapItinerary?.preferences.routePreference ?? 'balanced';
  const latestAnalysis = mapItinerary?.latestAnalysis;
  const hasAppliedLatestAnalysis = Boolean(
    latestAnalysis &&
      mapItinerary?.changeHistory.some(
        (record) =>
          new Date(record.changedAt).getTime() >=
          new Date(latestAnalysis.analyzedAt).getTime(),
      ),
  );
  // The banner appears only when a real proposal is waiting, from any scenario.
  const pendingRecommendation =
    latestAnalysis && !hasAppliedLatestAnalysis
      ? latestAnalysis.recommendations[0] ?? null
      : null;
  const itinerarySessionKey = params.itineraryId
    ? `requested:${params.itineraryId}`
    : mapItinerary
      ? `active:${mapItinerary.id}`
      : 'none';

  useEffect(() => {
    if (itinerarySessionKeyRef.current === itinerarySessionKey) return;
    itinerarySessionKeyRef.current = itinerarySessionKey;
    setSelectedDestination(undefined);
    setSelectedPlace(undefined);
    setIsPlaceRouteRequested(false);
    setSelectedIncidentId(undefined);
    setSelectedMonitoringId(undefined);
    setMode('explore');
    setRouteModeOverride(null);
  }, [itinerarySessionKey]);

  let baseMode: MapInteractionMode = 'explore';
  if (routeTargetEndpointOverride) {
    baseMode = 'route-preview';
  } else if (droppedPin) {
    baseMode = 'place-selected';
  } else if (selectedMonitoringPoint) {
    baseMode = 'monitoring-selected';
  } else if (selectedIncident) {
    baseMode = 'incident-selected';
  } else if (selectedPlace) {
    baseMode = isPlaceRouteRequested ? 'route-preview' : 'place-selected';
  } else if (alertDestination) {
    baseMode = 'destination-selected';
  } else if (selectedDestination) {
    baseMode = mode;
  } else if (mapItinerary && currentStop && isJourneyRequested) {
    // Opening the map from an itinerary is an explicit request to see that
    // journey. It used to also require the `destinationId` param to match the
    // current stop, and any mismatch silently downgraded the screen to
    // `destination-selected`, which draws no route at all.
    baseMode = 'active-journey';
  } else if (
    mapItinerary &&
    currentStop &&
    (!parameterDestination ||
      parameterDestination.id === currentStop.destinationId)
  ) {
    baseMode = 'active-journey';
  } else if (parameterDestination) {
    baseMode = 'destination-selected';
  }
  const displayedMode: MapInteractionMode =
    pendingRecommendation && baseMode === 'active-journey'
      ? 'reoptimization-pending'
      : baseMode;
  const isJourneyMode =
    displayedMode === 'active-journey' ||
    displayedMode === 'reoptimization-pending';
  const showRoute = displayedMode === 'route-preview' || isJourneyMode;
  const routeVisualState: MapRouteVisualState =
    displayedMode === 'reoptimization-pending'
      ? 'affected'
      : displayedMode === 'active-journey'
        ? 'active'
        : routeMode;

  const routeOriginEndpoint = useMemo<RouteEndpoint>(() => {
    // An origin the user set explicitly always wins.
    if (explicitOrigin) return explicitOrigin;
    // While a journey runs the live position drives the leg, rounded so a new
    // route is only requested after meaningful movement.
    if (journey.isActive && journey.routeAnchor) {
      return {
        id: 'journey-position',
        name: t('map.myLocation'),
        latitude: journey.routeAnchor.latitude,
        longitude: journey.routeAnchor.longitude,
      };
    }
    if (currentLocation.coordinate) {
      return {
        id: 'current-location',
        name: t('map.myLocation'),
        latitude: currentLocation.coordinate.latitude,
        longitude: currentLocation.coordinate.longitude,
      };
    }
    return {
      id: routeOriginLocation.id ?? 'journey-origin',
      name: routeOriginLocation.name,
      latitude: routeOriginLocation.latitude,
      longitude: routeOriginLocation.longitude,
    };
  }, [
    currentLocation.coordinate,
    explicitOrigin,
    journey.isActive,
    journey.routeAnchor,
    routeOriginLocation,
    t,
  ]);

  const routeDestinationEndpoint = useMemo<RouteEndpoint | undefined>(() => {
    if (routeTargetEndpointOverride) return routeTargetEndpointOverride;
    if (isJourneyMode && activeItineraryPlace) {
      return {
        id: activeItineraryPlace.id,
        name: activeItineraryPlace.name,
        latitude: activeItineraryPlace.latitude,
        longitude: activeItineraryPlace.longitude,
      };
    }
    if (selectedPlace && isPlaceRouteRequested) {
      return {
        id: selectedPlace.id,
        name: selectedPlace.name,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      };
    }
    if (displayedDestination) {
      return {
        id: displayedDestination.id,
        name: displayedDestination.name,
        latitude: displayedDestination.latitude,
        longitude: displayedDestination.longitude,
      };
    }
    return undefined;
  }, [
    activeItineraryPlace,
    displayedDestination,
    isJourneyMode,
    isPlaceRouteRequested,
    routeTargetEndpointOverride,
    selectedPlace,
  ]);

  const routePreview = useRoutePreview(
    routeDestinationEndpoint ? routeOriginEndpoint : undefined,
    routeDestinationEndpoint,
  );
  const selectedRouteId = routePreview.result?.selectionByMode[routeMode];
  const selectedRoute =
    routePreview.result?.routes.find(
      (route) => route.candidate.id === selectedRouteId,
    ) ?? null;
  /** Route ETA when a provider answered, otherwise the local scenario estimate. */
  const travelMinutes = selectedRoute
    ? Math.max(1, Math.round(selectedRoute.candidate.durationSeconds / 60))
    : displayedDestination
      ? getTravelMinutesBetween(routeOriginLocation, displayedDestination)
      : undefined;
  const destinationCondition = useDestinationCondition(
    displayedDestination,
    travelMinutes,
  );

  useEffect(() => {
    if (
      !mapItinerary ||
      !selectedAlert ||
      pendingRecommendation ||
      !isRouteDisruptionAlert(selectedAlert) ||
      (!isEventRelevantToItinerary(selectedAlert, mapItinerary) &&
        !isEventNearNextItineraryLeg(selectedAlert, mapItinerary))
    ) {
      return;
    }

    const requestKey = `${mapItinerary.id}:${selectedAlert.id}`;
    if (requestedReanalysis.current === requestKey) return;
    requestedReanalysis.current = requestKey;
    void reanalyzeRemainingStops(mapItinerary.id).catch(() => undefined);
  }, [
    mapItinerary,
    pendingRecommendation,
    reanalyzeRemainingStops,
    selectedAlert,
  ]);

  const canvasDestinations = useMemo(() => {
    const visibleById = new Map(
      destinations.map((destination) => [destination.id, destination]),
    );
    if (itineraryDestination) {
      visibleById.set(itineraryDestination.id, itineraryDestination);
    }
    if (displayedDestination) {
      visibleById.set(displayedDestination.id, displayedDestination);
    }
    return [...visibleById.values()];
  }, [displayedDestination, itineraryDestination]);
  const priorityDestinationIds = useMemo(
    () =>
      itineraryDestination || displayedDestination
        ? [
            ...new Set(
              [itineraryDestination?.id, displayedDestination?.id].filter(
                (id): id is string => Boolean(id),
              ),
            ),
          ]
        : [],
    [displayedDestination, itineraryDestination],
  );
  /** Incidents the itinerary analysis already flagged, matched through the alert feed. */
  const routeRelevantIncidentIds = useMemo(() => {
    if (!mapItinerary) return [];
    const relevantAlertIds = new Set(
      travelAlerts
        .filter((alert) => isEventRelevantToItinerary(alert, mapItinerary))
        .map((alert) => alert.id),
    );
    return intelligence.incidents
      .filter(
        (incident) => incident.alertId && relevantAlertIds.has(incident.alertId),
      )
      .map((incident) => incident.id);
  }, [intelligence.incidents, mapItinerary]);
  const effectiveLayerVisibility = useMemo<MapLayerVisibility>(
    () => ({
      ...layerVisibility,
      // A deep link to an alert always shows that incident, whatever the toggle says.
      incidents: Boolean(linkedIncident) || layerVisibility.incidents,
      cctvAtcs: Boolean(selectedMonitoringId) || layerVisibility.cctvAtcs,
      // An active journey always shows its own route and stops.
      routes: isJourneyMode || (layerVisibility.routes && showRoute),
      itineraryStops: isJourneyMode || layerVisibility.itineraryStops,
    }),
    [
      isJourneyMode,
      layerVisibility,
      linkedIncident,
      selectedMonitoringId,
      showRoute,
    ],
  );
  const mapPadding = useMemo(
    () => ({
      top: insets.top + layout.inputHeight + spacing[5],
      right: layout.minTouchTarget + spacing[6],
      bottom: Math.max(panelHeight + spacing[6], spacing[10]),
      left: spacing[4],
    }),
    [insets.top, panelHeight],
  );

  const closeSearch = useCallback( () => {
    setIsSearchExpanded(false);
    Keyboard.dismiss();
  }, []);

  const clearSelections = useCallback( () => {
    setSelectedPlace(undefined);
    setIsPlaceRouteRequested(false);
    setSelectedIncidentId(undefined);
    setSelectedMonitoringId(undefined);
    setDroppedPin(undefined);
    setRouteTargetEndpointOverride(undefined);
  }, []);

  /**
   * Any point on the map can become an endpoint: a NADI destination, a Google
   * place, or a bare coordinate. Only NADI destinations carry NADI intelligence.
   */
  const toEndpoint = (
    id: string,
    name: string,
    coordinate: MapLatLng,
  ): RouteEndpoint => ({
    id,
    name,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
  });

  const dropPin = useCallback( (coordinate: MapLatLng) => {
    if (Date.now() - lastMarkerPressAt.current < 400) return;
    closeSearch();
    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(undefined);
    setSelectedPlace(undefined);
    setIsPlaceRouteRequested(false);
    setSelectedIncidentId(undefined);
    setSelectedMonitoringId(undefined);
    setRouteTargetEndpointOverride(undefined);
    setDroppedPin(coordinate);
    setMode('place-selected');
  }, [closeSearch, router]);

  const selectPoi = useCallback( (poi: {
    placeId: string;
    name: string;
    coordinate: MapLatLng;
  }) => {
    closeSearch();
    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(undefined);
    setDroppedPin(undefined);
    setSelectedIncidentId(undefined);
    setSelectedMonitoringId(undefined);
    setRouteTargetEndpointOverride(undefined);
    setIsPlaceRouteRequested(false);
    setMode('place-selected');
    // Reuses the Google Place domain from Phase 1; no second place model.
    setSelectedPlace({
      id: `google:${poi.placeId}`,
      source: 'google-place',
      name: poi.name,
      latitude: poi.coordinate.latitude,
      longitude: poi.coordinate.longitude,
      placeId: poi.placeId,
    });
  }, [closeSearch, router]);

  const droppedPinLabel = droppedPin
    ? `${droppedPin.latitude.toFixed(5)}, ${droppedPin.longitude.toFixed(5)}`
    : '';

  /** "Route to here" for any point, keeping the existing origin fallback. */
  const routeToPoint = (endpoint: RouteEndpoint) => {
    setRouteTargetEndpointOverride(endpoint);
    setMode('route-preview');
  };

  /** "Depart from here": sets the origin and stays on the map. */
  const departFromPoint = (endpoint: RouteEndpoint) => {
    setExplicitOrigin(endpoint);
    setDroppedPin(undefined);
    setSelectedPlace(undefined);
    setMode(routeDestinationEndpoint ? 'route-preview' : 'explore');
  };

  const selectDestination = useCallback( (destination: Destination) => {
    lastMarkerPressAt.current = Date.now();
    router.setParams({ destinationId: undefined, alertId: undefined });
    clearSelections();
    setSelectedDestination(destination);
    setMode('destination-selected');
  }, [clearSelections, router]);

  const selectSearchResult = (result: MapPlaceResult) => {
    closeSearch();
    search.clear();

    if (result.source === 'nadi-destination' && result.destinationId) {
      const destination = destinations.find(
        (item) => item.id === result.destinationId,
      );
      if (destination) selectDestination(destination);
      return;
    }

    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(undefined);
    setSelectedIncidentId(undefined);
    setSelectedMonitoringId(undefined);
    setIsPlaceRouteRequested(false);
    setMode('place-selected');
    setSelectedPlace(result);
  };

  const selectIncident = useCallback( (incidentId: string) => {
    lastMarkerPressAt.current = Date.now();
    closeSearch();
    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(undefined);
    setSelectedPlace(undefined);
    setIsPlaceRouteRequested(false);
    setSelectedMonitoringId(undefined);
    setSelectedIncidentId(incidentId);
    setMode('incident-selected');
  }, [closeSearch, router]);

  const selectMonitoringPoint = useCallback( (pointId: string) => {
    lastMarkerPressAt.current = Date.now();
    closeSearch();
    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(undefined);
    setSelectedPlace(undefined);
    setIsPlaceRouteRequested(false);
    setSelectedIncidentId(undefined);
    setSelectedMonitoringId(pointId);
    setMode('monitoring-selected');
  }, [closeSearch, router]);

  const closeDetailSelection = () => {
    router.setParams({ alertId: undefined });
    clearSelections();
    setMode('explore');
  };

  const recenter = () => {
    closeSearch();
    void currentLocation.resolve().finally(() => {
      setRecenterSignal((current) => current + 1);
    });
  };

  const showUnavailableDetail = () => {
    Alert.alert(
      t('map.detailUnavailableTitle'),
      t('map.detailUnavailableMessage'),
    );
  };

  /**
   * Starting a journey hands over to the itinerary service. There is no second
   * journey store: an approved itinerary whose next stop matches the previewed
   * destination becomes the active one.
   */
  /**
   * Starting a journey is a mode transition, not a dialog. An approved itinerary
   * whose next stop matches the previewed destination becomes the active one;
   * the itinerary service owns the status change.
   */
  const startJourney = () => {
    const targetId = routeDestinationEndpoint?.id;
    const startableItinerary = itineraries.find((itinerary) => {
      if (itinerary.status !== 'approved') return false;
      const nextStop = itinerary.approvedPlan?.stops.find(
        (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
      );
      return (
        nextStop?.destinationId === targetId || nextStop?.place.id === targetId
      );
    });

    if (!startableItinerary) {
      // Nothing to activate: this is a plain route preview, so stay on it.
      setJourneyNotice(t('map.panel.journeyNeedsItinerary'));
      return;
    }

    setJourneyNotice(null);
    void start(startableItinerary.id)
      .then(() => {
        clearSelections();
        setSelectedDestination(undefined);
        setExplicitOrigin(undefined);
        setMode('explore');
        setRecenterSignal((current) => current + 1);
      })
      .catch(() => undefined);
  };

  /** Continue focuses the current leg and re-centres on the traveller. */
  const continueJourney = () => {
    closeSearch();
    clearSelections();
    setSelectedDestination(undefined);
    setMode('explore');
    void currentLocation.resolve().finally(() => {
      setRecenterSignal((current) => current + 1);
    });
  };

  /**
   * Completing a stop is an itinerary action first. The incentive system is a
   * consumer of that event and never writes back into the plan.
   */
  const markStopCompleted = () => {
    if (!mapItinerary || !currentStop) return;
    const stop = currentStop;
    void completeCurrentStop(mapItinerary.id)
      .then(() => {
        setRecenterSignal((current) => current + 1);
        // Arrival is the verification; the stop id keeps the award idempotent.
        void recordActivity({
          id: `stop-completed-${mapItinerary.id}-${stop.id}`,
          type: 'destination-visit',
          targetType: 'destination',
          targetId: stop.destinationId,
          targetName: stop.destinationNameSnapshot,
          verification: 'journey-arrival',
          occurredAt: new Date().toISOString(),
        });
      })
      .catch(() => undefined);
  };

  const openItinerary = () => {
    if (!mapItinerary) return;
    router.push({ pathname: '/itinerary/[id]', params: { id: mapItinerary.id } });
  };

  const handlePanelLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setPanelHeight((current) => (current === nextHeight ? current : nextHeight));
  };

  const renderPanel = () => {
    if (droppedPin && !routeTargetEndpointOverride) {
      return (
        <DroppedPinPanel
          coordinateLabel={droppedPinLabel}
          onRouteHere={() =>
            routeToPoint(
              toEndpoint(
                `custom:${droppedPinLabel}`,
                t('map.panel.droppedPinTitle'),
                droppedPin,
              ),
            )
          }
          onDepartHere={() =>
            departFromPoint(
              toEndpoint(
                `custom:${droppedPinLabel}`,
                t('map.panel.droppedPinTitle'),
                droppedPin,
              ),
            )
          }
          onClear={closeDetailSelection}
        />
      );
    }
    if (selectedMonitoringPoint) {
      return (
        <MonitoringDetailPanel
          point={selectedMonitoringPoint}
          onPlayRecording={() => setIsPlaybackOpen(true)}
          onClose={closeDetailSelection}
        />
      );
    }
    if (selectedIncident) {
      return (
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={closeDetailSelection}
        />
      );
    }
    if (displayedMode === 'place-selected' && selectedPlace) {
      return (
        <PlaceDetailPanel
          place={selectedPlace}
          onRouteToPlace={() => setIsPlaceRouteRequested(true)}
          onDepartFromPlace={() =>
            departFromPoint(
              toEndpoint(selectedPlace.id, selectedPlace.name, selectedPlace),
            )
          }
          onClear={closeDetailSelection}
        />
      );
    }
    if (isJourneyMode && (activeItineraryPlace || itineraryDestination)) {
      return (
        <ActiveJourneyPanel
          nextStopName={
            activeItineraryPlace?.name ?? itineraryDestination?.name ?? ''
          }
          plannedArrival={currentStop?.plannedArrival}
          travelMinutes={
            travelMinutes ?? currentStop?.routeToStop?.estimatedTravelMinutes
          }
          remainingCount={remainingStops.length}
          condition={destinationCondition}
          distanceMeters={
            selectedRoute?.candidate.distanceMeters ?? undefined
          }
          routeRisk={selectedRoute?.score.routeRisk}
          providerTrafficSeverity={selectedRoute?.score.providerTrafficSeverity}
          hasArrived={journey.hasArrived}
          isRouteUnavailable={routePreview.result?.status === 'unavailable'}
          onContinue={continueJourney}
          onMarkCompleted={markStopCompleted}
          onOpenItinerary={mapItinerary ? openItinerary : undefined}
        />
      );
    }
    if (displayedMode === 'route-preview' && routeDestinationEndpoint) {
      return (
        <RoutePreviewPanel
          originName={routeOriginEndpoint.name}
          destinationName={routeDestinationEndpoint.name}
          result={routePreview.result}
          isLoading={routePreview.isLoading}
          routeMode={routeMode}
          selectedRoute={selectedRoute}
          onRouteModeChange={setRouteModeOverride}
          onStartJourney={startJourney}
          notice={journeyNotice}
        />
      );
    }
    if (displayedMode === 'destination-selected' && displayedDestination) {
      return (
        <DestinationDetailPanel
          destination={displayedDestination}
          travelMinutes={
            travelMinutes ?? displayedDestination.estimatedTravelMinutes
          }
          condition={destinationCondition}
          onViewDetail={showUnavailableDetail}
          onChooseDestination={() => {
            router.setParams({ destinationId: undefined });
            setSelectedDestination(displayedDestination);
            setMode('route-preview');
          }}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.screen}>
      <MapCanvas
        destinations={canvasDestinations}
        selectedDestination={displayedDestination}
        selectedPlace={selectedPlace}
        activePlace={activeItineraryPlace}
        itineraryStops={itineraryStops}
        startLocation={routeOriginLocation}
        currentLocation={currentLocation.coordinate ?? undefined}
        priorityDestinationIds={priorityDestinationIds}
        trafficSegments={intelligence.trafficSegments}
        monitoringPoints={intelligence.monitoringPoints}
        incidents={intelligence.incidents}
        destinationCrowd={intelligence.destinationCrowd}
        safetyZones={intelligence.safetyZones}
        parkingAreas={intelligence.parkingAreas}
        selectedIncident={selectedIncident}
        selectedMonitoringPoint={selectedMonitoringPoint}
        routeCandidates={routePreview.result?.routes}
        selectedRouteId={selectedRouteId}
        routeRelevantIncidentIds={routeRelevantIncidentIds}
        layerVisibility={effectiveLayerVisibility}
        showRoute={showRoute}
        routeVisualState={routeVisualState}
        recenterSignal={recenterSignal}
        mapPadding={mapPadding}
        onSelectDestination={selectDestination}
        onSelectIncident={selectIncident}
        onSelectMonitoringPoint={selectMonitoringPoint}
        onMapPress={dropPin}
        onPoiPress={selectPoi}
        droppedPin={droppedPin}
      />

      <View
        pointerEvents="box-none"
        style={[styles.topOverlay, { paddingTop: insets.top + spacing[2] }]}
      >
        <MapSearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          onClear={search.clear}
          catalogResults={search.catalogResults}
          googleResults={search.googleResults}
          status={search.status}
          isExpanded={isSearchExpanded}
          onExpand={() => setIsSearchExpanded(true)}
          onSelect={selectSearchResult}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('map.filterButton')}
          accessibilityState={{ expanded: isFilterOpen }}
          onPress={() => {
            closeSearch();
            setIsFilterOpen(true);
          }}
          style={({ pressed }) => [
            styles.filterButton,
            hasCustomLayers && styles.filterButtonActive,
            pressed && styles.controlPressed,
          ]}
        >
          <SlidersHorizontal
            size={iconSizes.inline}
            color={hasCustomLayers ? colors.neutral.white : colors.brand[700]}
          />
          <AppText
            numberOfLines={1}
            variant="labelMd"
            color={hasCustomLayers ? colors.neutral.white : colors.brand[700]}
          >
            {t('map.filterButton')}
          </AppText>
        </Pressable>
      </View>

      <View style={[styles.floatingActions, { top: insets.top + 72 }]}>
        <IconButton
          variant="soft"
          accessibilityLabel={t('map.recenter')}
          icon={<LocateFixed size={iconSizes.header} color={colors.brand[700]} />}
          onPress={recenter}
        />
        <IconButton
          variant="soft"
          accessibilityLabel={t('map.layersAccessibility')}
          icon={<Layers3 size={iconSizes.header} color={colors.brand[700]} />}
          onPress={() => {
            closeSearch();
            setIsFilterOpen(true);
          }}
        />
      </View>

      <View
        pointerEvents="none"
        style={[styles.dataContext, { bottom: panelHeight + spacing[2] }]}
      >
        <AppText variant="micro" color={colors.neutral.textSecondary}>
          {t('map.localDataContext')}
        </AppText>
      </View>

      <View
        pointerEvents="box-none"
        style={styles.bottomPanel}
        onLayout={handlePanelLayout}
      >
        {pendingRecommendation && mapItinerary && (
          <ReoptimizationBanner
            actionLabel={t('map.reviewRecommendation', { ns: 'itinerary' })}
            onPress={() =>
              router.push({
                pathname: '/itinerary/[id]/reoptimize',
                params: { id: mapItinerary.id },
              })
            }
          />
        )}
        {renderPanel()}
      </View>

      <MapFilterSheet
        visible={isFilterOpen}
        layerVisibility={layerVisibility}
        onToggleLayer={toggleLayer}
        onClose={() => setIsFilterOpen(false)}
      />
      <MonitoringPlaybackModal
        visible={isPlaybackOpen}
        point={selectedMonitoringPoint}
        onClose={() => setIsPlaybackOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.brand[50],
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: layout.screenPadding,
    right: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  filterButton: {
    maxWidth: 118,
    minHeight: layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
  filterButtonActive: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  floatingActions: {
    position: 'absolute',
    right: layout.screenPadding,
    gap: spacing[2],
  },
  controlPressed: {
    opacity: 0.72,
  },
  dataContext: {
    position: 'absolute',
    right: layout.screenPadding,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.white,
  },
  bottomPanel: {
    position: 'absolute',
    right: layout.screenPadding,
    bottom: spacing[3],
    left: layout.screenPadding,
    gap: spacing[2],
  },
});
