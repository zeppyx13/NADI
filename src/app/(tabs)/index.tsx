import { useRouter } from 'expo-router';
import { MapPinned } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IncentiveEntryCard } from '@/components/incentive/incentive-entry-card';
import { HomeHeader } from '@/components/home/home-header';
import { ImportantAlertCard } from '@/components/home/important-alert-card';
import { JourneyCard } from '@/components/home/journey-card';
import {
  RecommendationCarousel,
  type HomeDestinationItem,
} from '@/components/home/recommendation-carousel';
import { TravelConditionCard } from '@/components/home/travel-condition-card';
import {
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
import type { Itinerary } from '@/types/itinerary';
import type { AlertSeverity, TravelAlert } from '@/types/travel-alert';
import {
  getLocalDateInput,
  isEventRelevantToItinerary,
} from '@/utils/itinerary';

const severityPriority: Record<AlertSeverity, number> = {
  danger: 3,
  warning: 2,
  info: 1,
};

function compareAlerts(first: TravelAlert, second: TravelAlert): number {
  return (
    severityPriority[second.severity] - severityPriority[first.severity] ||
    second.createdAt.localeCompare(first.createdAt) ||
    first.id.localeCompare(second.id)
  );
}

function getFeaturedAlert(preferredAlertId: string | null): TravelAlert | null {
  const preferredAlert = travelAlerts.find((alert) => alert.id === preferredAlertId);
  if (preferredAlert) return preferredAlert;
  return [...travelAlerts].sort(compareAlerts)[0] ?? null;
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

function getBriefingItinerary(
  itineraries: readonly Itinerary[],
  activeItinerary: Itinerary | null,
  today: string,
): Itinerary | null {
  if (activeItinerary) return activeItinerary;

  return (
    itineraries
      .filter(
        (itinerary) =>
          itinerary.status === 'approved' && itinerary.date >= today,
      )
      .sort(
        (first, second) =>
          first.date.localeCompare(second.date) ||
          first.createdAt.localeCompare(second.createdAt) ||
          first.id.localeCompare(second.id),
      )[0] ?? null
  );
}

function hasPendingRouteIncidentRecommendation(itinerary: Itinerary): boolean {
  const analysis = itinerary.latestAnalysis;
  // Any scenario that produced a proposal counts, not just a route incident.
  if (!analysis || analysis.recommendations.length === 0) return false;

  const hasAppliedRecommendation = itinerary.changeHistory.some(
    (record) =>
      Boolean(record.recommendationId) &&
      new Date(record.changedAt).getTime() >=
        new Date(analysis.analyzedAt).getTime() &&
      analysis.recommendations.some(
        (recommendation) => recommendation.id === record.recommendationId,
      ),
  );
  if (hasAppliedRecommendation) return false;

  return analysis.recommendations.some((recommendation) =>
    recommendation.reasonCodes.includes('route-incident'),
  );
}

export default function HomeScreen() {
  const { t } = useTranslation('home');
  const router = useRouter();
  const { status, data, retry } = useHomeDashboard();
  const { itineraries, activeItinerary, isHydrated } = useItineraries();

  const openExplore = () => router.push('/(tabs)/explore');
  const openMap = () => router.push('/(tabs)/map');
  const openAlerts = () => router.push('/(tabs)/alerts');
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

  const today = getLocalDateInput();
  const briefingItinerary = getBriefingItinerary(
    itineraries,
    activeItinerary,
    today,
  );
  const openJourney = () => {
    if (!briefingItinerary) {
      router.push('/itinerary/create');
      return;
    }
    if (briefingItinerary.status === 'active') {
      router.push({
        pathname: '/(tabs)/map',
        params: { itineraryId: briefingItinerary.id },
      });
      return;
    }
    router.push({
      pathname: '/itinerary/[id]',
      params: { id: briefingItinerary.id },
    });
  };

  if (status === 'error') {
    return (
      <ScreenContainer scroll style={styles.screen}>
        <ErrorState
          title={t('states.errorTitle')}
          description={t('states.errorDescription')}
          retryLabel={t('states.retry')}
          onRetry={retry}
        />
        <JourneyCard
          itinerary={briefingItinerary}
          isToday={briefingItinerary?.date === today}
          onPress={openJourney}
        />
      </ScreenContainer>
    );
  }

  if (status === 'empty' || !data) {
    return (
      <ScreenContainer scroll style={styles.screen}>
        <EmptyState
          icon={<MapPinned size={iconSizes.empty} color={colors.neutral.iconMuted} />}
          title={t('states.emptyTitle')}
          description={t('states.emptyDescription')}
          action={{ label: t('states.emptyAction'), onPress: openExplore }}
        />
        <JourneyCard
          itinerary={briefingItinerary}
          isToday={briefingItinerary?.date === today}
          onPress={openJourney}
        />
      </ScreenContainer>
    );
  }

  const featuredAlert = getFeaturedAlert(data.featuredAlertId);
  const hasPendingRouteChange = Boolean(
    activeItinerary && hasPendingRouteIncidentRecommendation(activeItinerary),
  );
  const journeyRelevantAlert =
    activeItinerary
      ? [...travelAlerts]
          .filter((alert) =>
            isEventRelevantToItinerary(alert, activeItinerary),
          )
          .sort(compareAlerts)[0] ?? null
      : null;
  const contextualAlert = journeyRelevantAlert ??
    (activeItinerary ? null : featuredAlert);
  const isJourneyAffected = Boolean(
    journeyRelevantAlert && activeItinerary && hasPendingRouteChange,
  );
  const recommendationItems = getDestinationItems(
    data.recommendedDestinationIds,
    data.destinationInsights,
  );
  const unreadAlertCount = travelAlerts.filter((alert) => !alert.isRead).length;

  const openContextualAlert = () => {
    if (isJourneyAffected && activeItinerary) {
      router.push({
        pathname: '/itinerary/[id]/reoptimize',
        params: { id: activeItinerary.id },
      });
      return;
    }
    if (contextualAlert) openAlertOnMap(contextualAlert.id);
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

      <TravelConditionCard
        summary={data.conditionSummary}
        onOpenMap={openMap}
      />

      {contextualAlert && (
        <ImportantAlertCard
          alert={contextualAlert}
          distanceKm={
            contextualAlert.id === featuredAlert?.id
              ? data.featuredAlertDistanceKm ?? undefined
              : undefined
          }
          emphasized={isJourneyAffected}
          onPress={openContextualAlert}
        />
      )}

      <JourneyCard
        itinerary={briefingItinerary}
        isToday={briefingItinerary?.date === today}
        onPress={openJourney}
      />

      <IncentiveEntryCard />

      <View>
        <RecommendationCarousel
          items={recommendationItems}
          onSeeAll={openExplore}
          onSelectDestination={openDestination}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
    gap: spacing[5],
  },
});
