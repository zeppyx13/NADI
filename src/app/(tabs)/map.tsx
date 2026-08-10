import { useLocalSearchParams, useRouter } from 'expo-router';
import { LocateFixed, SlidersHorizontal, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { MapCanvas } from '@/components/map/map-canvas';
import {
  MapInfoPanel,
  type MapScreenMode,
} from '@/components/map/map-info-panel';
import { AppText, IconButton, SearchField } from '@/components/ui';
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
import { destinationScenarioConditions } from '@/data/itinerary-scenarios';
import type { Destination } from '@/types/destination';
import { isEventRelevantToItinerary } from '@/utils/itinerary';

type MapFilter = 'all' | 'destinations' | 'crowded' | 'safe' | 'incidents';

const mapFilters: readonly MapFilter[] = [
  'all',
  'destinations',
  'crowded',
  'incidents',
  'safe',
];

export default function MapScreen() {
  const { t } = useTranslation(['screens', 'itinerary']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    activeItinerary,
    getItinerary,
    reanalyzeRemainingStops,
  } = useItineraries();
  const params = useLocalSearchParams<{
    destinationId?: string;
    alertId?: string;
    itineraryId?: string;
  }>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');
  const [mode, setMode] = useState<MapScreenMode>('explore');
  const [selectedDestination, setSelectedDestination] = useState<Destination>();
  const [routeModeOverride, setRouteModeOverride] = useState<RouteMode | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const requestedReanalysis = useRef<string | null>(null);

  const requestedItinerary = params.itineraryId
    ? getItinerary(params.itineraryId)
    : null;
  const mapItinerary =
    requestedItinerary?.status === 'active' ? requestedItinerary : activeItinerary;
  const itineraryPlan = mapItinerary?.approvedPlan ?? null;
  const nextItineraryStop = itineraryPlan?.stops.find(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );
  const itineraryDestination = destinations.find(
    (item) => item.id === nextItineraryStop?.destinationId,
  );
  const activeItineraryPlace = nextItineraryStop?.place;
  const parameterDestination = destinations.find(
    (item) => item.id === params.destinationId,
  );
  const displayedDestination =
    parameterDestination ?? selectedDestination ?? itineraryDestination;

  let displayedMode: MapScreenMode = 'explore';
  if (selectedDestination) {
    displayedMode = mode;
  } else if (
    mapItinerary &&
    nextItineraryStop &&
    (!parameterDestination || parameterDestination.id === nextItineraryStop.destinationId)
  ) {
    displayedMode = 'active-journey';
  } else if (parameterDestination) {
    displayedMode = 'destination-selected';
  }

  const displayedFilter = params.alertId ? 'incidents' : activeFilter;
  const selectedAlert = travelAlerts.find((alert) => alert.id === params.alertId);
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
  const pendingRecommendation =
    latestAnalysis?.scenarioId === 'route-incident' && !hasAppliedLatestAnalysis
      ? latestAnalysis.recommendations[0] ?? null
      : null;

  useEffect(() => {
    if (
      !mapItinerary ||
      !selectedAlert ||
      pendingRecommendation ||
      !isEventRelevantToItinerary(selectedAlert, mapItinerary)
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

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleDestinations = useMemo(
    () =>
      destinations.filter((destination) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          destination.name.toLocaleLowerCase().includes(normalizedQuery) ||
          destination.region.toLocaleLowerCase().includes(normalizedQuery) ||
          destination.regency.toLocaleLowerCase().includes(normalizedQuery) ||
          destination.tags.some((tag) =>
            tag.toLocaleLowerCase().includes(normalizedQuery),
          );
        const matchesFilter =
          displayedFilter === 'all' ||
          displayedFilter === 'destinations' ||
          (displayedFilter === 'crowded' &&
            Boolean(
              destination.occupancyLevel &&
                ['high', 'critical'].includes(destination.occupancyLevel),
            )) ||
          (displayedFilter === 'safe' &&
            destinationScenarioConditions[destination.id]?.routeRisk === 'low');
        return displayedFilter !== 'incidents' && matchesQuery && matchesFilter;
      }),
    [displayedFilter, normalizedQuery],
  );
  const canvasDestinations =
    itineraryDestination &&
    !visibleDestinations.some(
      (destination) => destination.id === itineraryDestination.id,
    )
      ? [...visibleDestinations, itineraryDestination]
      : visibleDestinations;
  const priorityDestinationIds =
    normalizedQuery.length > 0
      ? visibleDestinations.slice(0, 8).map((destination) => destination.id)
      : [];
  const mapPadding = useMemo(
    () => ({
      top: insets.top + layout.inputHeight + spacing[5],
      right: layout.minTouchTarget + spacing[6],
      bottom: panelHeight + spacing[6],
      left: spacing[4],
    }),
    [insets.top, panelHeight],
  );

  const selectDestination = (destination: Destination) => {
    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(destination);
    setMode('destination-selected');
  };

  const selectFilter = (filter: MapFilter) => {
    router.setParams({ alertId: undefined });
    setActiveFilter(filter);
    setIsFilterOpen(false);
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
      ? t('map.filterButton', { defaultValue: 'Filter' })
      : t(`map.filters.${displayedFilter}`);

  return (
    <View style={styles.screen}>
      <MapCanvas
        destinations={canvasDestinations}
        selectedDestination={displayedDestination}
        activePlace={activeItineraryPlace}
        startLocation={mapItinerary?.startLocation}
        priorityDestinationIds={priorityDestinationIds}
        showIncident={displayedFilter === 'all' || displayedFilter === 'incidents'}
        showCrowdedArea={displayedFilter === 'all' || displayedFilter === 'crowded'}
        showRoute={
          displayedMode === 'route-preview' || displayedMode === 'active-journey'
        }
        routeMode={routeMode}
        recenterSignal={recenterSignal}
        mapPadding={mapPadding}
        onSelectDestination={selectDestination}
      />

      <View style={[styles.topOverlay, { paddingTop: insets.top + spacing[2] }]}>
        <SearchField
          value={query}
          placeholder={t('map.searchPlaceholder')}
          accessibilityLabel={t('map.searchAccessibility')}
          clearAccessibilityLabel={t('explore.clearSearch')}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          style={styles.searchField}
          returnKeyType="search"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('map.filterButton', { defaultValue: 'Filter' })}
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
      </View>

      <View style={styles.bottomPanel} onLayout={handlePanelLayout}>
        <MapInfoPanel
          mode={displayedMode}
          selectedDestination={displayedDestination}
          activePlace={activeItineraryPlace}
          routeMode={routeMode}
          activeArrivalTime={nextItineraryStop?.plannedArrival}
          onFindDestination={() => {
            selectFilter('destinations');
            setIsFilterOpen(true);
          }}
          onChooseDestination={() => {
            if (!displayedDestination) return;
            router.setParams({ destinationId: undefined });
            setSelectedDestination(displayedDestination);
            setMode('route-preview');
          }}
          onViewDetail={showUnavailableDetail}
          onRouteModeChange={setRouteModeOverride}
          onStartJourney={startJourney}
          itineraryAction={
            mapItinerary
              ? {
                  label: t('map.itineraryAction', {
                    ns: 'itinerary',
                    defaultValue: 'Rencana perjalanan',
                  }),
                  onPress: openItinerary,
                }
              : undefined
          }
          pendingRecommendationAction={
            pendingRecommendation && mapItinerary
              ? {
                  label: t('map.reviewRecommendation', {
                    ns: 'itinerary',
                    defaultValue: 'Tinjau',
                  }),
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

      <Modal
        animationType="fade"
        transparent
        visible={isFilterOpen}
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={() => setIsFilterOpen(false)}
            style={styles.modalBackdrop}
          />
          <View
            style={[
              styles.filterSheet,
              { paddingBottom: Math.max(insets.bottom, spacing[4]) },
            ]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitle}>
                <AppText variant="headingSm">
                  {t('map.filterTitle', { defaultValue: 'Filter peta' })}
                </AppText>
                <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                  {t('map.filterDescription', {
                    defaultValue: 'Pilih informasi yang ditampilkan.',
                  })}
                </AppText>
              </View>
              <IconButton
                accessibilityLabel={t('common.close')}
                icon={<X size={iconSizes.button} color={colors.neutral.textSecondary} />}
                onPress={() => setIsFilterOpen(false)}
              />
            </View>
            <View accessibilityRole="radiogroup" style={styles.filterOptions}>
              {mapFilters.map((filter) => {
                const selected = displayedFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => selectFilter(filter)}
                    style={({ pressed }) => [
                      styles.filterOption,
                      selected && styles.filterOptionSelected,
                      pressed && styles.controlPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        selected && styles.radioSelected,
                      ]}
                    >
                      {selected && <View style={styles.radioDot} />}
                    </View>
                    <AppText
                      variant="labelLg"
                      color={
                        selected ? colors.brand[700] : colors.neutral.textPrimary
                      }
                    >
                      {t(`map.filters.${filter}`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
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
  searchField: {
    flex: 1,
    backgroundColor: colors.neutral.white,
    ...shadows.md,
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
    borderColor: colors.neutral.borderSoft,
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
  bottomPanel: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    bottom: spacing[3],
    maxWidth: 560,
    alignSelf: 'center',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    opacity: 0.32,
    backgroundColor: colors.neutral.navy,
  },
  filterSheet: {
    paddingTop: spacing[2],
    paddingHorizontal: layout.screenPadding,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.neutral.white,
    ...shadows.lg,
  },
  sheetHandle: {
    width: spacing[10],
    height: spacing[1],
    alignSelf: 'center',
    marginBottom: spacing[3],
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.borderStrong,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  sheetTitle: {
    flex: 1,
    gap: spacing[1],
  },
  filterOptions: {
    gap: spacing[1],
    marginTop: spacing[3],
  },
  filterOption: {
    minHeight: layout.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
  },
  filterOptionSelected: {
    backgroundColor: colors.brand[50],
  },
  radio: {
    width: iconSizes.button,
    height: iconSizes.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.neutral.borderStrong,
  },
  radioSelected: {
    borderColor: colors.brand[600],
  },
  radioDot: {
    width: spacing[2],
    height: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.brand[600],
  },
});
