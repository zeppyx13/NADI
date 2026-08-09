import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, Flag, Navigation, RefreshCw, Route } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { ItineraryStatusBadge } from '@/components/itinerary/itinerary-status-badge';
import { ItineraryTimeline } from '@/components/itinerary/itinerary-timeline';
import { RouteModeBadge } from '@/components/route/route-mode-badge';
import { SimulationBadge } from '@/components/status/simulation-badge';
import {
  AppButton,
  AppCard,
  AppText,
  ErrorState,
  LoadingState,
  ScreenContainer,
  SectionHeader,
} from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import { useItineraries } from '@/context/itinerary-context';
import { formatItineraryDate } from '@/utils/itinerary';

export default function ItineraryDetailScreen() {
  const { t, i18n } = useTranslation('itinerary');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isHydrated, getItinerary, start, complete } = useItineraries();
  const itinerary = id ? getItinerary(id) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isHydrated) {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <LoadingState title={t('detail.loading')} />
      </ScreenContainer>
    );
  }

  if (!id || !itinerary) {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <ErrorState
          title={t('errors.notFoundTitle')}
          description={t('errors.notFound')}
          onRetry={() => router.replace('/itinerary')}
          retryLabel={t('common.backToPlans')}
        />
      </ScreenContainer>
    );
  }

  const plan = itinerary.approvedPlan ?? itinerary.originalPlan;
  const firstRemainingStop = plan.stops.find(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );

  const startJourney = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const active = await start(id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      router.replace({
        pathname: '/(tabs)/map',
        params: {
          itineraryId: active.id,
          destinationId: firstRemainingStop?.destinationId,
        },
      });
    } catch {
      setError(t('errors.save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeJourney = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await complete(id);
    } catch {
      setError(t('errors.save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.screen}
    >
      <ItineraryScreenHeader
        title={itinerary.title}
        subtitle={formatItineraryDate(itinerary.date, i18n.language)}
        backLabel={t('common.back')}
        onBack={() => router.back()}
      />

      <View style={styles.badges}>
        <ItineraryStatusBadge status={itinerary.status} />
        <SimulationBadge label={t('simulationLabel')} />
      </View>

      <AppCard variant="elevated" style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Route size={iconSizes.button} color={colors.brand[600]} />
          <AppText variant="headingSm">{plan.stops.length}</AppText>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t('detail.destinations')}
          </AppText>
        </View>
        <View style={styles.summaryItem}>
          <CalendarDays size={iconSizes.button} color={colors.teal[600]} />
          <AppText variant="headingSm">{itinerary.version}</AppText>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t('detail.version')}
          </AppText>
        </View>
        <View style={styles.summaryItem}>
          <RouteModeBadge mode={itinerary.preferences.routePreference} />
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t('detail.route')}
          </AppText>
        </View>
      </AppCard>

      <View>
        <SectionHeader title={t('detail.timeline')} />
        <ItineraryTimeline
          plan={plan}
          assessments={itinerary.latestAnalysis?.stopAssessments}
          showImages
        />
      </View>

      {error && (
        <AppText variant="bodySm" color={colors.semantic.danger.text}>
          {error}
        </AppText>
      )}

      {(itinerary.status === 'draft' || itinerary.status === 'suggested') && (
        <AppButton
          fullWidth
          label={t('detail.continueReview')}
          onPress={() =>
            router.push({ pathname: '/itinerary/review', params: { id: itinerary.id } })
          }
        />
      )}
      {itinerary.status === 'approved' && (
        <AppButton
          fullWidth
          variant="teal"
          loading={isSubmitting}
          label={t('detail.startJourney')}
          leadingIcon={<Navigation size={iconSizes.button} color={colors.neutral.white} />}
          onPress={() => void startJourney()}
        />
      )}
      {itinerary.status === 'active' && (
        <>
          <AppButton
            fullWidth
            variant="teal"
            label={t('detail.continueJourney')}
            leadingIcon={<Navigation size={iconSizes.button} color={colors.neutral.white} />}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/map',
                params: {
                  itineraryId: itinerary.id,
                  destinationId: firstRemainingStop?.destinationId,
                },
              })
            }
          />
          <AppButton
            fullWidth
            variant="secondary"
            label={t('detail.checkConditions')}
            leadingIcon={<RefreshCw size={iconSizes.button} color={colors.brand[700]} />}
            onPress={() =>
              router.push({
                pathname: '/itinerary/[id]/reoptimize',
                params: { id: itinerary.id },
              })
            }
          />
          <AppButton
            fullWidth
            variant="ghost"
            loading={isSubmitting}
            label={t('detail.completeJourney')}
            leadingIcon={<Flag size={iconSizes.button} color={colors.brand[500]} />}
            onPress={() => void completeJourney()}
          />
        </>
      )}
      {itinerary.status === 'completed' && (
        <AppCard variant="soft">
          <AppText variant="headingSm">{t('detail.completedTitle')}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t('detail.completedDescription')}
          </AppText>
        </AppCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[6],
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
});
