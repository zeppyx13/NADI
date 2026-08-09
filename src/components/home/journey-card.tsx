import { Navigation, Route } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { RouteModeBadge } from '@/components/route/route-mode-badge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { Itinerary } from '@/types/itinerary';
import { formatItineraryDate } from '@/utils/itinerary';

export type JourneyCardProps = {
  itinerary: Itinerary | null;
  onPress: () => void;
};

export function JourneyCard({ itinerary, onPress }: JourneyCardProps) {
  const { t, i18n } = useTranslation('home');

  if (!itinerary) {
    return (
      <AppCard variant="soft" style={styles.card}>
        <View style={styles.headingRow}>
          <View style={styles.icon}>
            <Route size={iconSizes.header} color={colors.teal[700]} />
          </View>
          <View style={styles.copy}>
            <AppText variant="headingSm">{t('planJourney.title')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('planJourney.description')}
            </AppText>
          </View>
        </View>
        <AppButton
          fullWidth
          variant="teal"
          label={t('planJourney.action')}
          leadingIcon={
            <Navigation size={iconSizes.button} color={colors.neutral.white} />
          }
          onPress={onPress}
        />
      </AppCard>
    );
  }

  const plan = itinerary.approvedPlan ?? itinerary.originalPlan;
  const nextStop = plan.stops.find(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );
  const isActive = itinerary.status === 'active';

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.brand[600]}>
            {t(isActive ? 'activeJourney.title' : 'plannedJourney.title')}
          </AppText>
          <AppText variant="headingSm">
            {isActive
              ? t('activeJourney.headingTo', {
                  destination: nextStop?.destinationNameSnapshot ?? itinerary.title,
                })
              : itinerary.title}
          </AppText>
        </View>
        <RouteModeBadge mode={itinerary.preferences.routePreference} />
      </View>
      <AppText variant="labelMd" color={colors.brand[700]}>
        {isActive
          ? t('activeJourney.metadata', {
              minutes: nextStop?.routeToStop?.estimatedTravelMinutes ?? 0,
              count: plan.stops.length,
            })
          : t('plannedJourney.metadata', {
              date: formatItineraryDate(itinerary.date, i18n.language),
              count: plan.stops.length,
            })}
      </AppText>
      <AppText variant="bodySm" color={colors.neutral.textSecondary}>
        {t(isActive ? 'activeJourney.smooth' : 'plannedJourney.description')}
      </AppText>
      <AppButton
        fullWidth
        label={t(isActive ? 'activeJourney.continue' : 'plannedJourney.open')}
        leadingIcon={
          <Navigation size={iconSizes.button} color={colors.neutral.white} />
        }
        onPress={onPress}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.teal[50],
  },
  copy: {
    flex: 1,
    minWidth: 180,
    gap: spacing[1],
  },
});
