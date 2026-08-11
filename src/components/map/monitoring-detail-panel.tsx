import { Play, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText, IconButton } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import { resolveMonitoringMedia } from '@/data/monitoring-media';
import type { MonitoringPoint } from '@/types/map-intelligence';

export type MonitoringDetailPanelProps = {
  point: MonitoringPoint;
  onPlayRecording: () => void;
  onClose: () => void;
};

export function MonitoringDetailPanel({
  point,
  onPlayRecording,
  onClose,
}: MonitoringDetailPanelProps) {
  const { t, i18n } = useTranslation('screens');
  const formattedTime = new Intl.DateTimeFormat(
    i18n.language === 'id' ? 'id-ID' : 'en-US',
    { hour: '2-digit', minute: '2-digit' },
  ).format(new Date(point.updatedAt));
  const hasRecording = resolveMonitoringMedia(point.recordedMedia) !== null;
  const isOffline = point.status === 'offline';

  return (
    <AppCard variant="elevated" style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText variant="headingSm">{point.name}</AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t(`map.monitoringType.${point.type}`)} · {point.area}
          </AppText>
        </View>
        <IconButton
          accessibilityLabel={t('common.close')}
          icon={<X size={iconSizes.button} color={colors.neutral.textSecondary} />}
          onPress={onClose}
        />
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <AppText variant="micro" color={colors.neutral.textSecondary}>
            {t('map.monitoringAreaCondition')}
          </AppText>
          <AppText variant="labelLg">
            {point.trafficCondition
              ? t(`map.trafficCondition.${point.trafficCondition}`)
              : t('map.monitoringConditionUnknown')}
          </AppText>
        </View>
        <View style={styles.metric}>
          <AppText variant="micro" color={colors.neutral.textSecondary}>
            {t('map.monitoringUpdatedAt')}
          </AppText>
          <AppText variant="labelLg">{formattedTime}</AppText>
        </View>
      </View>

      {point.status !== 'online' && (
        <AppText variant="caption" color={colors.semantic.warning.text}>
          {t(`map.monitoringStatus.${point.status}`)}
        </AppText>
      )}

      <AppButton
        fullWidth
        size="sm"
        variant="secondary"
        disabled={isOffline || !hasRecording}
        label={t('map.monitoringPlayAction')}
        leadingIcon={<Play size={iconSizes.button} color={colors.brand[700]} />}
        onPress={onPlayRecording}
      />
      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {hasRecording
          ? t('map.monitoringRecordedNote')
          : t('map.monitoringRecordingUnavailable')}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[2],
    padding: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing[6],
  },
  metric: {
    gap: spacing[1],
  },
});
