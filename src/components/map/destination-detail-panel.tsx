import { Clock3, Navigation } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OccupancyBadge } from '@/components/status/occupancy-badge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import type { DestinationArrivalCondition } from '@/services/destination-condition-service';
import type { Destination } from '@/types/destination';

export type DestinationDetailPanelProps = {
  destination: Destination;
  travelMinutes: number;
  condition: DestinationArrivalCondition | null;
  onViewDetail: () => void;
  onChooseDestination: () => void;
};

/**
 * Arrival-time intelligence for a NADI destination. Only the few facts that
 * change a decision are shown; anything without coverage is left out.
 */
export function DestinationDetailPanel({
  destination,
  travelMinutes,
  condition,
  onViewDetail,
  onChooseDestination,
}: DestinationDetailPanelProps) {
  const { t } = useTranslation('screens');
  const currentLevel = condition?.currentLevel;
  const predictedLevel = condition?.predictedLevel;
  const hasArrivalForecast = Boolean(predictedLevel && condition?.arrivalAt);

  return (
    <AppCard variant="elevated" style={styles.panel}>
      <View style={styles.titleRow}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.brand[600]}>
            {t('map.panel.selectedTitle')}
          </AppText>
          <AppText variant="headingMd">{destination.name}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {destination.regency} ·{' '}
            {t(`explore.category.${destination.category}`)}
          </AppText>
        </View>
      </View>

      <View style={styles.inlineMeta}>
        <Clock3 size={iconSizes.inline} color={colors.brand[600]} />
        <AppText variant="labelMd" color={colors.brand[700]}>
          {t('map.panel.estimate', { minutes: travelMinutes })}
        </AppText>
      </View>

      {currentLevel && (
        <View style={styles.conditionRow}>
          <View style={styles.conditionItem}>
            <AppText variant="micro" color={colors.neutral.textSecondary}>
              {t('map.panel.now')}
            </AppText>
            <OccupancyBadge level={currentLevel} size="sm" />
          </View>
          {hasArrivalForecast && predictedLevel && (
            <View style={styles.conditionItem}>
              <AppText variant="micro" color={colors.neutral.textSecondary}>
                {t('map.panel.predictedAtArrival', {
                  time: condition?.arrivalAt,
                })}
              </AppText>
              <OccupancyBadge level={predictedLevel} size="sm" />
            </View>
          )}
        </View>
      )}

      {(condition?.parkingStatus || condition?.areaRisk) && (
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {[
            condition.parkingStatus
              ? t(`map.parkingStatus.${condition.parkingStatus}`)
              : null,
            condition.areaRisk ? t(`map.safetyRisk.${condition.areaRisk}`) : null,
          ]
            .filter((item): item is string => item !== null)
            .join(' · ')}
        </AppText>
      )}

      {condition && !condition.hasCoverage && (
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t('map.panel.noCoverage')}
        </AppText>
      )}

      <View style={styles.actionRow}>
        <View style={styles.actionItem}>
          <AppButton
            fullWidth
            size="sm"
            variant="secondary"
            label={t('map.panel.viewDetail')}
            onPress={onViewDetail}
          />
        </View>
        <View style={styles.actionItem}>
          <AppButton
            fullWidth
            size="sm"
            label={t('map.panel.chooseDestination')}
            leadingIcon={
              <Navigation size={iconSizes.button} color={colors.neutral.white} />
            }
            onPress={onChooseDestination}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  inlineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
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
