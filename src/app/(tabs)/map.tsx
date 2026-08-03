import { useLocalSearchParams, useRouter } from 'expo-router';
import { Layers3, LocateFixed, Navigation } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
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
import { destinations } from '@/data/destinations';
import type { Destination } from '@/types/destination';

type MapFilter = 'all' | 'destinations' | 'crowded' | 'safe' | 'incidents';

const mapFilters: readonly MapFilter[] = [
  'all',
  'destinations',
  'crowded',
  'safe',
  'incidents',
];

export default function MapScreen() {
  const { t } = useTranslation('screens');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    destinationId?: string;
    alertId?: string;
  }>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');
  const [mode, setMode] = useState<MapScreenMode>('explore');
  const [selectedDestination, setSelectedDestination] = useState<Destination>();
  const [routeMode, setRouteMode] = useState<RouteMode>('balanced');
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [locationSignal, setLocationSignal] = useState(0);
  const parameterDestination = destinations.find(
    (item) => item.id === params.destinationId,
  );
  const displayedDestination = parameterDestination ?? selectedDestination;
  const displayedMode =
    parameterDestination && parameterDestination.id !== selectedDestination?.id
      ? 'destination-selected'
      : mode;
  const displayedFilter = params.alertId ? 'incidents' : activeFilter;

  const visibleDestinations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return destinations.filter((destination) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        destination.name.toLocaleLowerCase().includes(normalizedQuery) ||
        destination.region.toLocaleLowerCase().includes(normalizedQuery);
      const matchesFilter =
        displayedFilter === 'all' ||
        displayedFilter === 'destinations' ||
        (displayedFilter === 'crowded' &&
          ['high', 'critical'].includes(destination.occupancyLevel)) ||
        (displayedFilter === 'safe' &&
          ['low', 'moderate'].includes(destination.occupancyLevel));
      return displayedFilter !== 'incidents' && matchesQuery && matchesFilter;
    });
  }, [displayedFilter, query]);

  const selectDestination = (destination: Destination) => {
    router.setParams({ destinationId: undefined, alertId: undefined });
    setSelectedDestination(destination);
    setMode('destination-selected');
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

  return (
    <View style={styles.screen}>
      <MapCanvas
        destinations={visibleDestinations}
        selectedDestination={displayedDestination}
        showIncident={displayedFilter === 'all' || displayedFilter === 'incidents'}
        showCrowdedArea={displayedFilter === 'all' || displayedFilter === 'crowded'}
        showRoute={displayedMode === 'route-preview'}
        recenterSignal={recenterSignal}
        locationSignal={locationSignal}
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {mapFilters.map((filter) => {
            const selected = displayedFilter === filter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  router.setParams({ alertId: undefined });
                  setActiveFilter(filter);
                }}
                style={({ pressed }) => [
                  styles.filter,
                  selected && styles.filterSelected,
                  pressed && styles.filterPressed,
                ]}
              >
                <AppText
                  variant="labelMd"
                  color={selected ? colors.neutral.white : colors.neutral.textSecondary}
                >
                  {t(`map.filters.${filter}`)}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={[styles.floatingActions, { top: insets.top + 124 }]}>
        <IconButton
          variant="soft"
          accessibilityLabel={t('map.myLocation')}
          icon={<Navigation size={iconSizes.header} color={colors.brand[700]} />}
          onPress={() => setLocationSignal((current) => current + 1)}
        />
        <IconButton
          variant="soft"
          accessibilityLabel={t('map.recenter')}
          icon={<LocateFixed size={iconSizes.header} color={colors.brand[700]} />}
          onPress={() => setRecenterSignal((current) => current + 1)}
        />
        <IconButton
          variant="soft"
          accessibilityLabel={t('map.filters.destinations')}
          icon={<Layers3 size={iconSizes.header} color={colors.brand[700]} />}
          onPress={() => {
            router.setParams({ alertId: undefined });
            setActiveFilter('destinations');
          }}
        />
      </View>

      <View style={styles.bottomPanel}>
        <MapInfoPanel
          mode={displayedMode}
          selectedDestination={displayedDestination}
          routeMode={routeMode}
          onFindDestination={() => {
            router.setParams({ alertId: undefined });
            setActiveFilter('destinations');
          }}
          onChooseDestination={() => {
            if (displayedDestination) {
              router.setParams({ destinationId: undefined });
              setSelectedDestination(displayedDestination);
              setMode('route-preview');
            }
          }}
          onViewDetail={showUnavailableDetail}
          onRouteModeChange={setRouteMode}
          onStartJourney={startJourney}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brand[50],
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
  },
  searchField: {
    backgroundColor: colors.neutral.white,
    ...shadows.md,
  },
  filters: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  filter: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
    ...shadows.sm,
  },
  filterSelected: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[600],
  },
  filterPressed: {
    opacity: 0.72,
  },
  floatingActions: {
    position: 'absolute',
    right: layout.screenPadding,
    gap: spacing[2],
  },
  bottomPanel: {
    position: 'absolute',
    left: layout.screenPadding,
    right: layout.screenPadding,
    bottom: spacing[3],
    maxWidth: 560,
    alignSelf: 'center',
  },
});
