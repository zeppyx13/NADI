import { useRouter } from 'expo-router';
import { Info, MapPinned } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HomeHeader } from '@/components/home/home-header';
import { ImportantAlertCard } from '@/components/home/important-alert-card';
import { JourneyCard } from '@/components/home/journey-card';
import { LocalContextCard } from '@/components/home/local-context-card';
import { NearbyDestinationList } from '@/components/home/nearby-destination-list';
import {
  RecommendationCarousel,
  type HomeDestinationItem,
} from '@/components/home/recommendation-carousel';
import { TravelConditionCard } from '@/components/home/travel-condition-card';
import {
  AppCard,
  AppText,
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenContainer,
  SearchField,
} from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import { travelAlerts } from '@/data/alerts';
import { destinations } from '@/data/destinations';
import { useHomeDashboard } from '@/hooks/use-home-dashboard';
import type { HomeDestinationInsight } from '@/types/home';
import type { AlertSeverity, TravelAlert } from '@/types/travel-alert';
import { getLocalDateInput } from '@/utils/itinerary';

const severityPriority: Record<AlertSeverity, number> = {
  danger: 3,
  warning: 2,
  info: 1,
};

function getFeaturedAlert(preferredAlertId: string | null): TravelAlert | null {
  const preferredAlert = travelAlerts.find((alert) => alert.id === preferredAlertId);
  if (preferredAlert) return preferredAlert;

  return (
    [...travelAlerts].sort(
      (first, second) =>
        severityPriority[second.severity] - severityPriority[first.severity],
    )[0] ?? null
  );
}

function getDestinationItems(
  destinationIds: readonly string[],
  insights: readonly HomeDestinationInsight[],
): HomeDestinationItem[] {
  return destinationIds.flatMap((destinationId) => {
    const destination = destinations.find((item) => item.id === destinationId);
    const insight = insights.find((item) => item.destinationId === destinationId);
    return destination && insight ? [{ destination, insight }] : [];
  });
}

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const { status, data, retry } = useHomeDashboard();
  const { itineraries, activeItinerary, isHydrated } = useItineraries();

  const openExplore = () => router.push('/(tabs)/explore');
  const openMap = () => router.push('/(tabs)/map');
  const openAlerts = () => router.push('/(tabs)/alerts');
  const openItineraryHub = () => router.push('/itinerary');
  const openDestination = (destinationId: string) =>
    router.push({ pathname: '/(tabs)/map', params: { destinationId } });
  const openAlertOnMap = (alertId: string) =>
    router.push({ pathname: '/(tabs)/map', params: { alertId } });

  if (status === 'loading' || !isHydrated) {
    return (
      <ScreenContainer>
        <LoadingState
          title={t('states.loadingTitle')}
          description={t('states.loadingDescription')}
        />
      </ScreenContainer>
    );
  }

  if (status === 'error') {
    return (
      <ScreenContainer>
        <ErrorState
          title={t('states.errorTitle')}
          description={t('states.errorDescription')}
          retryLabel={t('states.retry')}
          onRetry={retry}
        />
      </ScreenContainer>
    );
  }

  if (status === 'empty' || !data) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={<MapPinned size={iconSizes.empty} color={colors.neutral.iconMuted} />}
          title={t('states.emptyTitle')}
          description={t('states.emptyDescription')}
          action={{ label: t('states.emptyAction'), onPress: openExplore }}
        />
      </ScreenContainer>
    );
  }

  const unreadAlertCount = travelAlerts.filter((alert) => !alert.isRead).length;
  const featuredAlert = getFeaturedAlert(data.featuredAlertId);
  const recommendationItems = getDestinationItems(
    data.recommendedDestinationIds,
    data.destinationInsights,
  );
  const nearbyItems = getDestinationItems(
    data.nearbyDestinationIds,
    data.destinationInsights,
  );
  const localContexts = data.localContextIds.flatMap((alertId) => {
    const alert = travelAlerts.find((item) => item.id === alertId);
    return alert ? [alert] : [];
  });
  const hasPartialContent =
    status === 'partial' ||
    recommendationItems.length !== data.recommendedDestinationIds.length ||
    nearbyItems.length !== data.nearbyDestinationIds.length ||
    localContexts.length !== data.localContextIds.length;
  const todayItinerary =
    activeItinerary ??
    itineraries.find(
      (itinerary) =>
        itinerary.status === 'approved' && itinerary.date === getLocalDateInput(),
    ) ??
    null;
  const openJourney = () => {
    if (!todayItinerary) {
      router.push('/itinerary/create');
      return;
    }
    if (todayItinerary.status === 'active') {
      router.push({
        pathname: '/(tabs)/map',
        params: { itineraryId: todayItinerary.id },
      });
      return;
    }
    router.push({ pathname: '/itinerary/[id]', params: { id: todayItinerary.id } });
  };

  return (
    <ScreenContainer scroll style={styles.screen}>
      <HomeHeader
        name={data.user.name}
        currentArea={data.user.currentArea}
        unreadAlertCount={unreadAlertCount}
        onOpenAlerts={openAlerts}
      />

      <SearchField
        editable={false}
        placeholder={t('searchPlaceholder')}
        accessibilityLabel={t('searchAccessibility')}
        onPressIn={openExplore}
      />

      {hasPartialContent && (
        <AppCard variant="soft" style={styles.partialNotice}>
          <Info size={iconSizes.button} color={colors.semantic.info.text} />
          <AppText variant="bodySm" color={colors.semantic.info.text} style={styles.flex}>
            {t('partialNotice')}
          </AppText>
        </AppCard>
      )}

      <TravelConditionCard
        summary={data.conditionSummary}
        onOpenMap={openMap}
      />

      {featuredAlert && (
        <ImportantAlertCard
          alert={featuredAlert}
          distanceKm={data.featuredAlertDistanceKm ?? undefined}
          onOpenMap={() => openAlertOnMap(featuredAlert.id)}
        />
      )}

      <JourneyCard
        itinerary={todayItinerary}
        onPress={openJourney}
      />

      <AppText
        accessibilityRole="link"
        onPress={openItineraryHub}
        variant="labelMd"
        color={colors.brand[600]}
        style={styles.itineraryLink}
      >
        {t('planJourney.openAll')}
      </AppText>

      <View>
        <RecommendationCarousel
          items={recommendationItems}
          onSeeAll={openExplore}
          onSelectDestination={openDestination}
        />
      </View>

      <NearbyDestinationList
        items={nearbyItems}
        onSelectDestination={openDestination}
      />

      {localContexts[0] && (
        <LocalContextCard
          alert={localContexts[0]}
          onViewAll={openAlerts}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[6],
  },
  partialNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  flex: {
    flex: 1,
  },
  itineraryLink: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[2],
  },
});
