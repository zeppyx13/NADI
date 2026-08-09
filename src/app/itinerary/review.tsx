import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { ItineraryTimeline } from '@/components/itinerary/itinerary-timeline';
import { SimulationBadge } from '@/components/status/simulation-badge';
import {
  AppBadge,
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

export default function ItineraryReviewScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    isHydrated,
    getItinerary,
    analyze,
    approve,
    approveOriginal,
  } = useItineraries();
  const itinerary = id ? getItinerary(id) : null;
  const requestedId = useRef<string | null>(null);
  const [selectedRecommendationIndex, setSelectedRecommendationIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !itinerary || itinerary.status !== 'draft' || requestedId.current === id) {
      return;
    }
    requestedId.current = id;
    void analyze(id).catch(() => setError(t('errors.analysis')));
  }, [analyze, id, itinerary, t]);

  if (!isHydrated || (itinerary?.status === 'draft' && !error)) {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <LoadingState
          title={t('review.analyzing')}
          description={t('review.analyzingDescription')}
        />
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

  if (error || !itinerary.latestAnalysis) {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <ErrorState
          title={t('errors.analysisTitle')}
          description={error ?? t('errors.analysis')}
          onRetry={() => {
            requestedId.current = id;
            setError(null);
            void analyze(id).catch(() => setError(t('errors.analysis')));
          }}
          retryLabel={t('common.retry')}
        />
      </ScreenContainer>
    );
  }

  const analysis = itinerary.latestAnalysis;
  const recommendations = analysis.recommendations;
  const selectedRecommendation = recommendations[selectedRecommendationIndex];
  const affectedAssessment = analysis.stopAssessments.find(
    (assessment) => assessment.issues.length > 0,
  );
  const affectedStop = itinerary.originalPlan.stops.find(
    (stop) => stop.id === affectedAssessment?.stopId,
  );

  const openDetail = (approvedId: string) =>
    router.replace({ pathname: '/itinerary/[id]', params: { id: approvedId } });

  const handleUseSuggestion = async () => {
    if (!selectedRecommendation) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const approved = await approve(id, selectedRecommendation.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      openDetail(approved.id);
    } catch {
      setError(t('errors.save'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const keepOriginal = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const approved = await approveOriginal(id);
      openDetail(approved.id);
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
        title={t('review.title')}
        subtitle={t('review.subtitle')}
        backLabel={t('common.back')}
        onBack={() => router.back()}
      />
      <SimulationBadge label={t('simulationLabel')} />

      <View>
        <SectionHeader title={t('review.originalPlan')} />
        <ItineraryTimeline
          plan={itinerary.originalPlan}
          assessments={analysis.stopAssessments}
        />
      </View>

      {recommendations.length === 0 ? (
        <AppCard variant="elevated" style={styles.recommendationCard}>
          <View style={styles.iconRow}>
            <ShieldCheck size={iconSizes.header} color={colors.semantic.success.main} />
            <AppText variant="headingMd">{t('review.noChangeTitle')}</AppText>
          </View>
          <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
            {t('review.noChangeDescription')}
          </AppText>
          <AppButton
            fullWidth
            loading={isSubmitting}
            label={t('review.usePlan')}
            onPress={() => void keepOriginal()}
          />
        </AppCard>
      ) : (
        <>
          <AppCard variant="soft" style={styles.issueCard}>
            <AppBadge variant="warning" label={t('review.needsAttention')} />
            <AppText variant="headingSm">
              {t('review.issueCount', { count: 1 })}
            </AppText>
            {affectedAssessment && affectedStop && (
              <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
                {t(`issues.${affectedAssessment.issues[0]?.type}`, {
                  destination: affectedStop.destinationNameSnapshot,
                  time: affectedAssessment.condition.predictedArrivalAt,
                })}
              </AppText>
            )}
          </AppCard>

          {selectedRecommendation && (
            <View>
              <SectionHeader
                title={t('review.suggestedPlan')}
                subtitle={t(`recommendation.type.${selectedRecommendation.type}`)}
              />
              <AppCard variant="elevated" style={styles.recommendationCard}>
                <View style={styles.iconRow}>
                  <Sparkles size={iconSizes.header} color={colors.teal[700]} />
                  <AppText variant="headingSm">
                    {t(`recommendation.type.${selectedRecommendation.type}`)}
                  </AppText>
                </View>
                <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
                  {t(
                    `recommendation.explanation.${selectedRecommendation.explanation.key}`,
                    selectedRecommendation.explanation,
                  )}
                </AppText>
                <ItineraryTimeline plan={selectedRecommendation.proposedPlan} />
                <View style={styles.impactBox}>
                  <AppText variant="labelLg">{t('review.impact')}</AppText>
                  <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                    {t('review.impactKeepsDestination')}
                  </AppText>
                  <AppText variant="bodySm" color={colors.neutral.textSecondary}>
                    {t('review.impactTravelDelta', {
                      minutes: selectedRecommendation.impact.travelMinutesDelta,
                    })}
                  </AppText>
                </View>
              </AppCard>
            </View>
          )}

          {error && (
            <AppText variant="bodySm" color={colors.semantic.danger.text}>
              {error}
            </AppText>
          )}
          <AppButton
            fullWidth
            variant="teal"
            loading={isSubmitting}
            label={t('review.useSuggestion')}
            trailingIcon={<ArrowRight size={iconSizes.button} color={colors.neutral.white} />}
            onPress={() => void handleUseSuggestion()}
          />
          <AppButton
            fullWidth
            variant="secondary"
            disabled={recommendations.length < 2 || isSubmitting}
            label={t('review.seeOtherOptions')}
            onPress={() =>
              setSelectedRecommendationIndex(
                (current) => (current + 1) % recommendations.length,
              )
            }
          />
          <AppButton
            fullWidth
            variant="ghost"
            disabled={isSubmitting}
            label={t('review.keepOriginal')}
            onPress={() => void keepOriginal()}
          />
        </>
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
  recommendationCard: {
    gap: spacing[4],
  },
  issueCard: {
    gap: spacing[2],
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  impactBox: {
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.teal[50],
  },
});
