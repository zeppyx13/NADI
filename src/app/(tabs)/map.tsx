import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Layers3,
  LocateFixed,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { DestinationPicker } from '@/components/itinerary/destination-picker';
import { MapCanvas } from '@/components/map/map-canvas';
import { MapInfoPanel } from '@/components/map/map-info-panel';
import {
  MapOptionsSheet,
  type MapOptionItem,
} from '@/components/map/map-options-sheet';
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
  destinationScenarioConditions,
  getTravelMinutesBetween,
} from '@/data/itinerary-scenarios';
import type { Destination } from '@/types/destination';
import type {
  MapInteractionMode,
  MapLayerVisibility,
  MapRouteVisualState,
} from '@/types/map';
import type { TravelAlert } from '@/types/travel-alert';
import {
  isEventNearNextItineraryLeg,
  isEventRelevantToItinerary,
  isRouteDisruptionAlert,
} from '@/utils/itinerary';

type MapFilter = 'all' | 'destinations' | 'crowded' | 'safe' | 'incidents';
type PublicMapLayer = 'destinations' | 'crowd' | 'incidents' | 'safety';

const mapFilters: readonly MapFilter[] = [
  'all',
  'destinations',
  'crowded',
  'incidents',
  'safe',
];

const publicMapLayers: readonly PublicMapLayer[] = [
  'destinations',
  'crowd',
  'incidents',
  'safety',
];

const initialLayerVisibility: MapLayerVisibility = {
  destinations: true,
  incidents: true,
  crowd: false,
  safety: false,
  routes: true,
  userLocation: true,
  customPlaces: true,
};

const incidentAlerts = travelAlerts.filter((alert) =>
  ['incident', 'traffic', 'road-closure'].includes(alert.type),
);

export default function MapScreen() {
  const { t } = useTranslation(['screens', 'itinerary']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeItinerary, getItinerary, reanalyzeRemainingStops } =
    useItineraries();
  const params = useLocalSearchParams<{
    destinationId?: string;
    alertId?: string;
    itineraryId?: string;
  }>();
  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');
  const [mode, setMode] = useState<MapInteractionMode>('explore');
  const [selectedDestination, setSelectedDestination] = useState<Destination>();
  const [routeModeOverride, setRouteModeOverride] = useState<RouteMode | null>(
    null,
  );
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>(
    initialLayerVisibility,
  );
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const requestedReanalysis = useRef<string | null>(null);
  const itinerarySessionKeyRef = useRef<string | null>(null);

  const requestedItinerary = params.itineraryId
    ? getItinerary(params.itineraryId)
    : null;
  const mapItinerary =
    requestedItinerary?.status === 'active' ? requestedItinerary : activeItinerary;
  const itineraryPlan = mapItinerary?.approvedPlan ?? null;
  const remainingStops = useMemo(
    () =>
      itineraryPlan?.stops.filter(
        (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
      ) ?? [],
    [itineraryPlan],
  );
  const nextItineraryStop = remainingStops[0];
  const nextStopIndex = nextItineraryStop
    ? itineraryPlan?.stops.findIndex((stop) => stop.id === nextItineraryStop.id) ??
      -1
    : -1;
  const previousCompletedStop =
    nextStopIndex > 0
      ? [...(itineraryPlan?.stops.slice(0, nextStopIndex) ?? [])]
          .reverse()
          .find((stop) => stop.status === 'completed')
      : undefined;
  const routeOriginLocation =
    previousCompletedStop?.place ??
    mapItinerary?.startLocation ??
    defaultItineraryStartLocation;
  const itineraryDestination = destinations.find(
    (item) => item.id === nextItineraryStop?.destinationId,
  );
  const activeItineraryPlace = nextItineraryStop?.place;
  const customPlaces = useMemo(
    () => itineraryPlan?.stops.map((stop) => stop.place) ?? [],
    [itineraryPlan],
  );
  const parameterDestination = destinations.find(
    (item) => item.id === params.destinationId,
  );
  const displayedDestination = params.alertId
    ? itineraryDestination
    : parameterDestination ?? selectedDestination ?? itineraryDestination;
  const selectedAlert = travelAlerts.find((alert) => alert.id === params.alertId);

  const routeMode =
    routeModeOverride ?? mapItinerary?.preferences.routePreference ?? 'balanced';
  const selectedTravelMinutes = displayedDestination
    ? getTravelMinutesBetween(
        routeOriginLocation,
        displayedDestination,
      )
    : undefined;
  const latestAnalysis = mapItinerary?.latestAnalysis;
  const hasAppliedLatestAnalysis = Boolean(
    latestAnalysis &&
      mapItinerary?.changeHistory.some(
        (record) =>
          new Date(record.changedAt).getTime() >=
          new Date(latestAnalysis.analyzedAt).getTime(),
      ),
  );
  const pendingRecommendation =
    latestAnalysis?.scenarioId === 'route-incident' && !hasAppliedLatestAnalysis
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
    setMode('explore');
    setRouteModeOverride(null);
  }, [itinerarySessionKey]);

  let baseMode: MapInteractionMode = 'explore';
  if (selectedDestination && !params.alertId) {
    baseMode = mode;
  } else if (
    mapItinerary &&
    nextItineraryStop &&
    (!parameterDestination ||
      parameterDestination.id === nextItineraryStop.destinationId)
  ) {
    baseMode = 'active-journey';
  } else if (parameterDestination) {
    baseMode = 'destination-selected';
  }
  const displayedMode: MapInteractionMode =
    pendingRecommendation && baseMode === 'active-journey'
      ? 'reoptimization-pending'
      : baseMode;
  const showRoute =
    displayedMode === 'route-preview' ||
    displayedMode === 'active-journey' ||
    displayedMode === 'reoptimization-pending';
  const routeVisualState: MapRouteVisualState =
    displayedMode === 'reoptimization-pending'
      ? 'affected'
      : displayedMode === 'active-journey'
        ? 'active'
        : routeMode;

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

  const displayedFilter: MapFilter = params.alertId ? 'incidents' : activeFilter;
  const filteredDestinations = useMemo(
    () =>
      destinations.filter((destination) => {
        if (displayedFilter === 'incidents') return false;
        if (displayedFilter === 'crowded') {
          return Boolean(
            destination.occupancyLevel &&
              ['high', 'critical'].includes(destination.occupancyLevel),
          );
        }
        if (displayedFilter === 'safe') {
          return (
            destinationScenarioConditions[destination.id]?.routeRisk === 'low'
          );
        }
        return true;
      }),
    [displayedFilter],
  );
  const canvasDestinations = useMemo(() => {
    const visibleById = new Map(
      filteredDestinations.map((destination) => [destination.id, destination]),
    );
    if (itineraryDestination) {
      visibleById.set(itineraryDestination.id, itineraryDestination);
    }
    if (displayedDestination) {
      visibleById.set(displayedDestination.id, displayedDestination);
    }
    return [...visibleById.values()];
  }, [displayedDestination, filteredDestinations, itineraryDestination]);
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
  const canvasAlerts = useMemo(() => {
    if (!selectedAlert || incidentAlerts.some((alert) => alert.id === selectedAlert.id)) {
      return incidentAlerts;
    }
    return [...incidentAlerts, selectedAlert];
  }, [selectedAlert]);
  const routeRelevantAlertIds = useMemo(
    () =>
      mapItinerary
        ? canvasAlerts
            .filter((alert) => isEventRelevantToItinerary(alert, mapItinerary))
            .map((alert) => alert.id)
        : [],
    [canvasAlerts, mapItinerary],
  );
  const effectiveLayerVisibility = useMemo<MapLayerVisibility>(
    () => ({
      ...layerVisibility,
      destinations:
        layerVisibility.destinations && displayedFilter !== 'incidents',
      incidents:
        Boolean(selectedAlert) ||
        (layerVisibility.incidents &&
          (displayedFilter === 'all' || displayedFilter === 'incidents')),
      crowd:
        layerVisibility.crowd &&
        (displayedFilter === 'all' || displayedFilter === 'crowded'),
      safety:
        layerVisibility.safety &&
        (displayedFilter === 'all' || displayedFilter === 'safe'),
      routes: layerVisibility.routes && showRoute,
    }),
    [displayedFilter, layerVisibility, selectedAlert, showRoute],
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

  const selectDestination = (destination: Destination) => {
    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(destination);
    setMode('destination-selected');
  };

  const selectAlert = (alert: TravelAlert) => {
    setSelectedDestination(undefined);
    setMode('explore');
    router.setParams({ destinationId: undefined, alertId: alert.id });
  };

  const selectFilter = (filter: MapFilter) => {
    router.setParams({ alertId: undefined });
    setActiveFilter(filter);
    setLayerVisibility((current) => {
      if (filter === 'destinations') return { ...current, destinations: true };
      if (filter === 'crowded') {
        return { ...current, destinations: true, crowd: true };
      }
      if (filter === 'incidents') return { ...current, incidents: true };
      if (filter === 'safe') {
        return { ...current, destinations: true, safety: true };
      }
      return current;
    });
    setIsFilterOpen(false);
  };

  const toggleLayer = (layer: PublicMapLayer) => {
    setLayerVisibility((current) => ({
      ...current,
      [layer]: !current[layer],
    }));
  };

  const showUnavailableDetail = () => {
    Alert.alert(
      t('map.detailUnavailableTitle'),
      t('map.detailUnavailableMessage'),
    );
  };

  const startJourney = () => {
    if (!displayedDestination) return;
    Alert.alert(
      t('map.journeyReadyTitle'),
      t('map.journeyReadyMessage', {
        mode: t(`map.panel.${routeMode}`).toLocaleLowerCase(),
        destination: displayedDestination.name,
      }),
    );
  };

  const openItinerary = () => {
    if (!mapItinerary) return;
    router.push({ pathname: '/itinerary/[id]', params: { id: mapItinerary.id } });
  };

  const handlePanelLayout = (event: LayoutChangeEvent) => {
    const nextHeight = Math.ceil(event.nativeEvent.layout.height);
    setPanelHeight((current) => (current === nextHeight ? current : nextHeight));
  };

  const filterButtonLabel =
    displayedFilter === 'all'
      ? t('map.filterButton')
      : t(`map.filters.${displayedFilter}`);
  const filterOptions: readonly MapOptionItem[] = mapFilters.map((filter) => ({
    id: filter,
    label: t(`map.filters.${filter}`),
    selected: displayedFilter === filter,
    onPress: () => selectFilter(filter),
  }));
  const layerOptions: readonly MapOptionItem[] = publicMapLayers.map((layer) => ({
    id: layer,
    label: t(`map.layerOptions.${layer}.label`),
    description: t(`map.layerOptions.${layer}.description`),
    selected: layerVisibility[layer],
    onPress: () => toggleLayer(layer),
  }));

  return (
    <View style={styles.screen}>
      <MapCanvas
        destinations={canvasDestinations}
        alerts={canvasAlerts}
        selectedDestination={displayedDestination}
        selectedAlert={selectedAlert}
        activePlace={activeItineraryPlace}
        customPlaces={customPlaces}
        startLocation={routeOriginLocation}
        priorityDestinationIds={priorityDestinationIds}
        routeRelevantAlertIds={routeRelevantAlertIds}
        layerVisibility={effectiveLayerVisibility}
        showRoute={showRoute}
        routeVisualState={routeVisualState}
        recenterSignal={recenterSignal}
        mapPadding={mapPadding}
        onSelectDestination={selectDestination}
        onSelectAlert={selectAlert}
      />

      <View style={[styles.topOverlay, { paddingTop: insets.top + spacing[2] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('map.searchAccessibility')}
          onPress={() => setIsSearchOpen(true)}
          style={({ pressed }) => [
            styles.searchTrigger,
            pressed && styles.controlPressed,
          ]}
        >
          <Search size={iconSizes.inline} color={colors.neutral.iconMuted} />
          <AppText
            numberOfLines={1}
            variant="bodyMd"
            color={colors.neutral.textMuted}
            style={styles.searchCopy}
          >
            {t('map.searchPlaceholder')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('map.filterButton')}
          accessibilityState={{ expanded: isFilterOpen }}
          onPress={() => setIsFilterOpen(true)}
          style={({ pressed }) => [
            styles.filterButton,
            displayedFilter !== 'all' && styles.filterButtonActive,
            pressed && styles.controlPressed,
          ]}
        >
          <SlidersHorizontal
            size={iconSizes.inline}
            color={
              displayedFilter === 'all'
                ? colors.brand[700]
                : colors.neutral.white
            }
          />
          <AppText
            numberOfLines={1}
            variant="labelMd"
            color={
              displayedFilter === 'all'
                ? colors.brand[700]
                : colors.neutral.white
            }
          >
            {filterButtonLabel}
          </AppText>
        </Pressable>
      </View>

      <View style={[styles.floatingActions, { top: insets.top + 72 }]}>
        <IconButton
          variant="soft"
          accessibilityLabel={t('map.recenter')}
          icon={<LocateFixed size={iconSizes.header} color={colors.brand[700]} />}
          onPress={() => setRecenterSignal((current) => current + 1)}
        />
        <IconButton
          variant="soft"
          accessibilityLabel={t('map.layersAccessibility')}
          icon={<Layers3 size={iconSizes.header} color={colors.brand[700]} />}
          onPress={() => setIsLayersOpen(true)}
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
        <MapInfoPanel
          mode={displayedMode}
          selectedDestination={displayedDestination}
          activePlace={activeItineraryPlace}
          routeMode={routeMode}
          routeOriginName={routeOriginLocation.name}
          selectedTravelMinutes={selectedTravelMinutes}
          activeArrivalTime={nextItineraryStop?.plannedArrival}
          activeTravelMinutes={
            nextItineraryStop?.routeToStop?.estimatedTravelMinutes ??
            itineraryDestination?.estimatedTravelMinutes
          }
          activeRemainingCount={remainingStops.length}
          onChooseDestination={() => {
            if (!displayedDestination) return;
            router.setParams({ destinationId: undefined });
            setSelectedDestination(displayedDestination);
            setMode('route-preview');
          }}
          onViewDetail={showUnavailableDetail}
          onRouteModeChange={setRouteModeOverride}
          onStartJourney={startJourney}
          continueJourneyAction={
            displayedMode === 'active-journey'
              ? {
                  label: t('map.panel.continueJourney'),
                  onPress: () =>
                    setRecenterSignal((current) => current + 1),
                }
              : undefined
          }
          itineraryAction={
            mapItinerary
              ? {
                  label: t('map.itineraryAction', { ns: 'itinerary' }),
                  onPress: openItinerary,
                }
              : undefined
          }
          pendingRecommendationAction={
            pendingRecommendation && mapItinerary
              ? {
                  label: t('map.reviewRecommendation', { ns: 'itinerary' }),
                  onPress: () =>
                    router.push({
                      pathname: '/itinerary/[id]/reoptimize',
                      params: { id: mapItinerary.id },
                    }),
                }
              : undefined
          }
        />
      </View>

      <DestinationPicker
        visible={isSearchOpen}
        title={t('map.searchTitle')}
        mode="single"
        selectedIds={displayedDestination ? [displayedDestination.id] : []}
        onClose={() => setIsSearchOpen(false)}
        onConfirm={(selected) => {
          setIsSearchOpen(false);
          const destination = selected[0];
          if (destination) selectDestination(destination);
        }}
      />
      <MapOptionsSheet
        visible={isFilterOpen}
        title={t('map.filterTitle')}
        description={t('map.filterDescription')}
        selectionMode="single"
        options={filterOptions}
        onClose={() => setIsFilterOpen(false)}
      />
      <MapOptionsSheet
        visible={isLayersOpen}
        title={t('map.layersTitle')}
        description={t('map.layersDescription')}
        selectionMode="multiple"
        options={layerOptions}
        onClose={() => setIsLayersOpen(false)}
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
    alignItems: 'center',
    gap: spacing[2],
  },
  searchTrigger: {
    flex: 1,
    minHeight: layout.inputHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    borderRadius: radii.md,
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
  searchCopy: {
    flex: 1,
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
  },
});
