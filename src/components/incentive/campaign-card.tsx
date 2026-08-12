import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBadge, AppCard, AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import type { IncentiveCampaign } from '@/types/incentive';

export type CampaignCardProps = {
  campaign: IncentiveCampaign;
  targetName?: string;
};

/**
 * Shows why a campaign exists, never the internal occupancy threshold that
 * motivated it.
 */
export function CampaignCard({ campaign, targetName }: CampaignCardProps) {
  const { t } = useTranslation('incentive');

  return (
    <AppCard variant="outlined" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <AppText variant="labelLg">{t(campaign.titleKey.replace('incentive.', ''))}</AppText>
          {targetName && (
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {targetName}
            </AppText>
          )}
        </View>
        <AppBadge
          size="sm"
          variant="info"
          label={t(
            `campaignObjective.${campaign.objective}` as 'campaignObjective.redistribute-visits',
          )}
        />
      </View>

      <AppText variant="bodySm" color={colors.neutral.textSecondary}>
        {t(campaign.descriptionKey.replace('incentive.', ''))}
      </AppText>

      <AppText variant="labelMd" color={colors.teal[700]}>
        {t('campaignReward', {
          multiplier: campaign.rewardMultiplier,
          points: campaign.bonusPoints,
        })}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[2],
    padding: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
