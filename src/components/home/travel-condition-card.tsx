import { Activity } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SimulationBadge } from '@/components/status/simulation-badge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { TravelConditionSummary, TravelConditionStatus } from '@/types/home';

export type TravelConditionCardProps = {
  summary: TravelConditionSummary;
  onOpenMap: () => void;
};

const statusColors: Record<
  TravelConditionStatus,
  { background: string; foreground: string }
> = {
  smooth: {
    background: colors.semantic.success.bg,
    foreground: colors.semantic.success.text,
  },
  moderate: {
    background: colors.semantic.warning.bg,
    foreground: colors.semantic.warning.text,
  },
  attention: {
    background: colors.semantic.danger.bg,
    foreground: colors.semantic.danger.text,
  },
};

export function TravelConditionCard({
  summary,
  onOpenMap,
}: TravelConditionCardProps) {
  const { t, i18n } = useTranslation('home');
  const statusColor = statusColors[summary.status];
  const updatedTime = new Intl.DateTimeFormat(
    i18n.language === 'id' ? 'id-ID' : 'en-US',
    { hour: '2-digit', minute: '2-digit' },
  ).format(new Date(summary.updatedAt));

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.sectionHeading}>
        <View style={styles.headingCopy}>
          <AppText variant="headingMd">{t('travelConditions.title')}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t('travelConditions.subtitle')}
          </AppText>
        </View>
        <SimulationBadge label={t('simulationLabel')} />
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusIcon, { backgroundColor: statusColor.background }]}>
          <Activity size={iconSizes.header} color={statusColor.foreground} />
        </View>
        <View style={styles.statusCopy}>
          <AppText variant="headingSm">
            {t(`travelConditions.${summary.status}Title`)}
          </AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t('travelConditions.summary', {
              crowdedCount: summary.crowdedAreaCount,
              incidentCount: summary.activeIncidentCount,
            })}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppText variant="caption" color={colors.neutral.textMuted}>
          {t('travelConditions.updatedAt', { time: updatedTime })}
        </AppText>
        <AppButton
          size="sm"
          variant="secondary"
          label={t('travelConditions.openMap')}
          onPress={onOpenMap}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[4],
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  headingCopy: {
    flex: 1,
    gap: spacing[1],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  statusIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  statusCopy: {
    flex: 1,
    gap: spacing[1],
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
});
