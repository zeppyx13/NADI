import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard, AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import type { ImpactCounters } from '@/types/incentive';

export type ImpactCardProps = {
  impact: ImpactCounters;
};

const counterOrder: readonly (keyof ImpactCounters)[] = [
  'alternativeVisits',
  'offPeakVisits',
  'localBusinessVisits',
  'distributionActions',
  'completedCampaigns',
];

/**
 * Impact is a set of explainable counters, never a single mysterious score.
 * The copy states what the traveller did; it never claims a measured effect on
 * city-wide crowding, because nothing here measures that.
 */
export function ImpactCard({ impact }: ImpactCardProps) {
  const { t } = useTranslation('incentive');
  const active = counterOrder.filter((key) => impact[key] > 0);

  return (
    <AppCard variant="outlined" style={styles.card}>
      <AppText variant="labelLg">{t('impactTitle')}</AppText>

      {active.length === 0 ? (
        <AppText variant="bodySm" color={colors.neutral.textSecondary}>
          {t('impactEmpty')}
        </AppText>
      ) : (
        <View style={styles.list}>
          {active.map((key) => (
            <AppText key={key} variant="bodySm">
              {t(`impact.${key}` as 'impact.alternativeVisits', {
                count: impact[key],
              })}
            </AppText>
          ))}
        </View>
      )}

      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {t('impactNote')}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[2],
    padding: spacing[4],
  },
  list: {
    gap: spacing[1],
  },
});
