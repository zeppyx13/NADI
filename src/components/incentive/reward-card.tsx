import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBadge, AppButton, AppCard, AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import type { RewardDefinition, RewardEntitlement } from '@/types/incentive';

export type RewardCardProps = {
  definition: RewardDefinition;
  entitlement?: RewardEntitlement;
  canAfford: boolean;
  onClaim?: () => void;
  onUse?: () => void;
};

const statusVariant = {
  available: 'info',
  claimed: 'success',
  redeemed: 'neutral',
  expired: 'danger',
} as const;

/**
 * Reward status is carried by a written label as well as colour, so it never
 * depends on colour alone.
 */
export function RewardCard({
  definition,
  entitlement,
  canAfford,
  onClaim,
  onUse,
}: RewardCardProps) {
  const { t, i18n } = useTranslation('incentive');
  const status = entitlement?.status ?? 'available';
  const validUntil = entitlement
    ? new Intl.DateTimeFormat(i18n.language === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
      }).format(new Date(entitlement.expiresAt))
    : null;

  return (
    <AppCard variant="outlined" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <AppText variant="labelLg">
            {t(definition.titleKey.replace('incentive.', ''))}
          </AppText>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t(definition.descriptionKey.replace('incentive.', ''))}
          </AppText>
        </View>
        <AppBadge
          size="sm"
          variant={statusVariant[status]}
          label={t(`rewardStatus.${status}` as 'rewardStatus.available')}
        />
      </View>

      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {definition.pointsCost > 0
          ? t('rewardCost', { count: definition.pointsCost })
          : t('rewardFree')}
        {validUntil ? ` · ${t('rewardValidUntil', { date: validUntil })}` : ''}
      </AppText>

      {entitlement && status !== 'redeemed' && status !== 'expired' && (
        <AppText variant="caption" color={colors.neutral.textSecondary}>
          {t('rewardCode', { code: entitlement.code })}
        </AppText>
      )}

      {!entitlement && onClaim && (
        <AppButton
          fullWidth
          size="sm"
          variant="secondary"
          disabled={!canAfford}
          label={t('rewardClaim')}
          accessibilityLabel={t('rewardClaim')}
          onPress={onClaim}
        />
      )}

      {entitlement && status === 'available' && onUse && (
        <AppButton
          fullWidth
          size="sm"
          label={t('rewardUse')}
          accessibilityLabel={t('rewardUse')}
          onPress={onUse}
        />
      )}
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
