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
  isToday?: boolean;
  onPress: () => void;
};

function getRouteSummary(itinerary: Itinerary): string {
  const plan = itinerary.approvedPlan ?? itinerary.originalPlan;
  const names = plan.stops
    .filter((stop) => stop.status !== 'skipped')
    .map((stop) => stop.destinationNameSnapshot);
  if (names.length === 0) return itinerary.title;

  const visibleNames = names.slice(0, 3);
  const hiddenCount = names.length - visibleNames.length;
  return `${visibleNames.join(' → ')}${hiddenCount > 0 ? ` → +${hiddenCount}` : ''}`;
}

export function JourneyCard({
  itinerary,
  isToday = false,
  onPress,
}: JourneyCardProps) {
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
  const remainingStops = plan.stops.filter(
    (stop) => stop.status !== 'completed' && stop.status !== 'skipped',
  );
  const nextStop = remainingStops[0];
  const isActive = itinerary.status === 'active';
  const travelMinutes = nextStop?.routeToStop?.estimatedTravelMinutes;
  const activeMetadata =
    travelMinutes !== undefined
      ? t('activeJourney.metadata', {
          minutes: travelMinutes,
          count: remainingStops.length,
        })
      : nextStop
        ? t('activeJourney.arrivalMetadata', {
            time: nextStop.plannedArrival,
            count: remainingStops.length,
          })
        : t('activeJourney.destinationCount', { count: remainingStops.length });

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.brand[600]}>
            {isActive
              ? t('activeJourney.title')
              : t(isToday ? 'plannedJourney.title' : 'upcomingJourney.title')}
          </AppText>
          <AppText variant="headingSm" numberOfLines={2}>
            {isActive
              ? t('activeJourney.headingTo', {
                  destination: nextStop?.destinationNameSnapshot ?? itinerary.title,
                })
              : getRouteSummary(itinerary)}
          </AppText>
        </View>
        <RouteModeBadge mode={itinerary.preferences.routePreference} />
      </View>
      <AppText variant="labelMd" color={colors.brand[700]}>
        {isActive
          ? activeMetadata
          : t('plannedJourney.metadata', {
              date: formatItineraryDate(itinerary.date, i18n.language),
              count: plan.stops.length,
            })}
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
