import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshCw, ShieldAlert } from 'lucide-react-native';
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

export default function ReoptimizeItineraryScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    isHydrated,
    getItinerary,
    reanalyzeRemainingStops,
    approve,
  } = useItineraries();
  const itinerary = id ? getItinerary(id) : null;
  const requestedId = useRef<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      !id ||
      !itinerary ||
      itinerary.status !== 'active' ||
      requestedId.current === id
    ) {
      return;
    }
    requestedId.current = id;
    void reanalyzeRemainingStops(id).catch(() => setError(t('errors.analysis')));
  }, [id, itinerary, reanalyzeRemainingStops, t]);

  const hasReoptimizationAnalysis =
    itinerary?.latestAnalysis?.scenarioId === 'route-incident';

  if (!isHydrated || (itinerary?.status === 'active' && !hasReoptimizationAnalysis && !error)) {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <LoadingState
          title={t('reoptimization.loading')}
          description={t('reoptimization.loadingDescription')}
        />
      </ScreenContainer>
    );
  }

  if (!id || !itinerary || itinerary.status !== 'active') {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <ErrorState
          title={t('errors.notFoundTitle')}
          description={t('reoptimization.activeOnly')}
          onRetry={() => router.replace('/itinerary')}
          retryLabel={t('common.backToPlans')}
        />
      </ScreenContainer>
    );
  }

  const analysis = itinerary.latestAnalysis;
  if (error || !analysis || analysis.scenarioId !== 'route-incident') {
    return (
      <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
        <ErrorState
          title={t('errors.analysisTitle')}
          description={error ?? t('errors.analysis')}
          onRetry={() => {
            setError(null);
            void reanalyzeRemainingStops(id).catch(() => setError(t('errors.analysis')));
          }}
          retryLabel={t('common.retry')}
        />
      </ScreenContainer>
    );
  }

  const plan = itinerary.approvedPlan ?? itinerary.originalPlan;
  const recommendation = analysis.recommendations[selectedIndex];

  const handleUseSuggestion = async () => {
    if (!recommendation) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await approve(id, recommendation.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
      router.replace({ pathname: '/itinerary/[id]', params: { id } });
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
        title={t('reoptimization.title')}
        subtitle={t('reoptimization.subtitle')}
        backLabel={t('common.back')}
        onBack={() => router.back()}
      />
      <View style={styles.badges}>
        <SimulationBadge label={t('simulationLabel')} />
        <AppBadge variant="warning" label={t('reoptimization.awaitingVerification')} />
      </View>

      <AppCard variant="soft" style={styles.alertCard}>
        <ShieldAlert size={iconSizes.header} color={colors.semantic.danger.main} />
        <View style={styles.flex}>
          <AppText variant="headingSm">{t('reoptimization.affectedTitle')}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t('reoptimization.affectedDescription')}
          </AppText>
        </View>
      </AppCard>

      <View>
        <SectionHeader
          title={t('reoptimization.currentPlan')}
          subtitle={t('reoptimization.remainingOnly')}
        />
        <ItineraryTimeline plan={plan} assessments={analysis.stopAssessments} />
      </View>

      {recommendation && (
        <View>
          <SectionHeader
            title={t('reoptimization.option')}
            subtitle={t(`recommendation.type.${recommendation.type}`)}
          />
          <AppCard variant="elevated" style={styles.optionCard}>
            <View style={styles.optionHeader}>
              <RefreshCw size={iconSizes.header} color={colors.teal[700]} />
              <AppText variant="headingSm">
                {t(`recommendation.type.${recommendation.type}`)}
              </AppText>
            </View>
            <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
              {t(
                `recommendation.explanation.${recommendation.explanation.key}`,
                recommendation.explanation,
              )}
            </AppText>
            <ItineraryTimeline plan={recommendation.proposedPlan} />
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
        disabled={!recommendation}
        label={t('review.useSuggestion')}
        onPress={() => void handleUseSuggestion()}
      />
      <AppButton
        fullWidth
        variant="secondary"
        disabled={(analysis.recommendations.length ?? 0) < 2 || isSubmitting}
        label={t('review.seeOtherOptions')}
        onPress={() =>
          setSelectedIndex(
            (current) => (current + 1) % analysis.recommendations.length,
          )
        }
      />
      <AppButton
        fullWidth
        variant="ghost"
        disabled={isSubmitting}
        label={t('reoptimization.keepCurrent')}
        onPress={() => router.replace({ pathname: '/itinerary/[id]', params: { id } })}
      />
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  flex: {
    flex: 1,
    gap: spacing[1],
  },
  optionCard: {
    gap: spacing[4],
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
});
