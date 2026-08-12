import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard, AppText } from '@/components/ui';
import { colors, radii, spacing } from '@/constants/theme';
import type { LevelDefinition, UserProgress } from '@/types/incentive';

export type ProgressSummaryCardProps = {
  progress: UserProgress;
  level: LevelDefinition;
  nextLevel: LevelDefinition | null;
};

/**
 * Level and XP always come from the incentive store; this card never computes
 * a level or a balance of its own.
 */
export function ProgressSummaryCard({
  progress,
  level,
  nextLevel,
}: ProgressSummaryCardProps) {
  const { t } = useTranslation('incentive');

  const span = nextLevel ? nextLevel.minimumXp - level.minimumXp : 0;
  const earned = progress.totalXp - level.minimumXp;
  const ratio = span > 0 ? Math.min(1, Math.max(0, earned / span)) : 1;
  const progressLabel = nextLevel
    ? t('xpProgress', { current: progress.totalXp, target: nextLevel.minimumXp })
    : t('xpMax');

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t('level.label')} {level.level}
          </AppText>
          <AppText variant="headingSm">
            {t(`level.${level.level}` as 'level.1')}
          </AppText>
        </View>
        <View style={styles.pointsPill}>
          <AppText variant="labelMd" color={colors.brand[700]}>
            {t('pointsBalance', { count: progress.pointsBalance })}
          </AppText>
        </View>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: nextLevel?.minimumXp ?? progress.totalXp,
          now: progress.totalXp,
          text: progressLabel,
        }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>

      {/* The number is always written out, never left to the bar alone. */}
      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {progressLabel}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
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
  pointsPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: colors.brand[50],
  },
  track: {
    height: 8,
    overflow: 'hidden',
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.surfaceMuted,
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.teal[600],
  },
});
