import { Clock3, Route } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import type { DestinationArrivalCondition } from '@/services/destination-condition-service';

export type ActiveJourneyPanelProps = {
  nextStopName: string;
  plannedArrival?: string;
  travelMinutes?: number;
  remainingCount: number;
  condition: DestinationArrivalCondition | null;
  onContinue: () => void;
  onOpenItinerary?: () => void;
};

export function ActiveJourneyPanel({
  nextStopName,
  plannedArrival,
  travelMinutes,
  remainingCount,
  condition,
  onContinue,
  onOpenItinerary,
}: ActiveJourneyPanelProps) {
  const { t } = useTranslation('screens');
  const summary = [
    travelMinutes !== undefined
      ? t('map.panel.activeTravelTime', { minutes: travelMinutes })
      : null,
    t('map.panel.remainingDestinations', { count: remainingCount }),
  ]
    .filter((item): item is string => item !== null)
    .join(' · ');

  return (
    <AppCard variant="elevated" style={styles.panel}>
      <View style={styles.copy}>
        <AppText variant="caption" color={colors.teal[700]}>
          {t('map.panel.nextDestination')}
        </AppText>
        <AppText variant="headingMd">{nextStopName}</AppText>
        <View style={styles.metaRow}>
          <Route size={iconSizes.inline} color={colors.teal[700]} />
          <AppText variant="labelMd" color={colors.teal[700]}>
            {summary}
          </AppText>
        </View>
        {plannedArrival && (
          <View style={styles.metaRow}>
            <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
            <AppText variant="labelMd" color={colors.neutral.textSecondary}>
              {t('map.panel.nextArrival', { time: plannedArrival })}
            </AppText>
          </View>
        )}
      </View>

      {condition?.predictedLevel && (
        <View style={styles.conditionItem}>
          <AppText variant="micro" color={colors.neutral.textSecondary}>
            {t('map.panel.predictedAtArrival', {
              time: plannedArrival ?? condition.arrivalAt,
            })}
          </AppText>
          <OccupancyBadge level={condition.predictedLevel} size="sm" />
        </View>
      )}

      <View style={styles.actionRow}>
        {onOpenItinerary && (
          <View style={styles.actionItem}>
            <AppButton
              fullWidth
              size="sm"
              variant="secondary"
              label={t('map.panel.itineraryPlan')}
              onPress={onOpenItinerary}
            />
          </View>
        )}
        <View style={styles.actionItem}>
          <AppButton
            fullWidth
            size="sm"
            variant="teal"
            label={t('map.panel.continueJourney')}
            onPress={onContinue}
          />
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[2],
    padding: spacing[3],
  },
  copy: {
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  conditionItem: {
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionItem: {
    flex: 1,
  },
});
