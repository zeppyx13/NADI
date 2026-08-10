import { Activity, ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard, AppText } from '@/components/ui';
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
  const { t } = useTranslation('home');
  const statusColor = statusColors[summary.status];
  const summaryLabel = `${t(`travelConditions.${summary.status}Title`)} · ${t(
    'travelConditions.compactSummary',
    {
      crowdedCount: summary.crowdedAreaCount,
      incidentCount: summary.activeIncidentCount,
    },
  )}`;

  return (
    <AppCard
      variant="soft"
      accessibilityLabel={`${t('travelConditions.title')}. ${summaryLabel}`}
      onPress={onOpenMap}
      style={styles.card}
    >
      <View style={[styles.statusIcon, { backgroundColor: statusColor.background }]}>
        <Activity size={iconSizes.button} color={statusColor.foreground} />
      </View>
      <View style={styles.copy}>
        <AppText variant="labelLg">{t('travelConditions.title')}</AppText>
        <AppText variant="bodySm" color={colors.neutral.textSecondary}>
          {summaryLabel}
        </AppText>
      </View>
      <ChevronRight size={iconSizes.button} color={colors.neutral.iconMuted} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
  },
  statusIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  copy: {
    flex: 1,
    gap: spacing[1],
  },
});
