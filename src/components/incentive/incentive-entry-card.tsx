import { useRouter } from 'expo-router';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import { useIncentive } from '@/context/incentive-context';

export type IncentiveEntryCardProps = {
  /** Compact form for Home; the fuller form is used in Profile. */
  variant?: 'compact' | 'detailed';
};

/**
 * A read-only summary that links to the activity screen. Home never becomes a
 * gamification dashboard, and no screen recomputes level or balance.
 */
export function IncentiveEntryCard({
  variant = 'compact',
}: IncentiveEntryCardProps) {
  const { t } = useTranslation('incentive');
  const router = useRouter();
  const { progress, level, nextLevel } = useIncentive();

  const xpLabel = nextLevel
    ? t('xpProgress', { current: progress.totalXp, target: nextLevel.minimumXp })
    : t('xpMax');
  const impactTotal =
    progress.impact.alternativeVisits +
    progress.impact.offPeakVisits +
    progress.impact.localBusinessVisits;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('openActivity')}
      onPress={() => router.push('/activity')}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.iconWrap}>
          <Sparkles size={iconSizes.button} color={colors.brand[600]} />
        </View>
        <View style={styles.copy}>
          <AppText variant="labelLg">
            {t('level.label')} {level.level} ·{' '}
            {t('pointsBalance', { count: progress.pointsBalance })}
          </AppText>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {xpLabel}
          </AppText>
          {variant === 'detailed' && (
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {t('profileEntrySubtitle')}
            </AppText>
          )}
          {variant === 'compact' && impactTotal > 0 && (
            <AppText variant="caption" color={colors.teal[700]}>
              {t('impactNote')}
            </AppText>
          )}
        </View>
        <ChevronRight size={iconSizes.button} color={colors.neutral.iconMuted} />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.brand[50],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.72,
  },
});
