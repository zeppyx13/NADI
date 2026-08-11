import { X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBadge, AppCard, AppText, IconButton } from '@/components/ui';
import { colors, iconSizes, spacing } from '@/constants/theme';
import type { MapIncident } from '@/types/map-intelligence';

export type IncidentDetailPanelProps = {
  incident: MapIncident;
  onClose: () => void;
};

export function IncidentDetailPanel({
  incident,
  onClose,
}: IncidentDetailPanelProps) {
  const { t, i18n } = useTranslation('screens');
  const timeFormatter = new Intl.DateTimeFormat(
    i18n.language === 'id' ? 'id-ID' : 'en-US',
    { hour: '2-digit', minute: '2-digit' },
  );
  const startedAt = timeFormatter.format(new Date(incident.startedAt));
  const endsAt = incident.endsAt
    ? timeFormatter.format(new Date(incident.endsAt))
    : null;

  return (
    <AppCard variant="elevated" style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t(`map.incidentType.${incident.type}`)} · {incident.locationName}
          </AppText>
          <AppText variant="headingSm">{t(incident.titleKey)}</AppText>
        </View>
        <IconButton
          accessibilityLabel={t('common.close')}
          icon={<X size={iconSizes.button} color={colors.neutral.textSecondary} />}
          onPress={onClose}
        />
      </View>

      <AppText variant="bodySm" color={colors.neutral.textSecondary}>
        {t(incident.descriptionKey)}
      </AppText>

      <View style={styles.badges}>
        <AppBadge
          size="sm"
          variant={incident.status === 'verified' ? 'info' : 'warning'}
          label={t(`map.incidentStatus.${incident.status}`)}
        />
        <AppBadge
          size="sm"
          variant={
            incident.accessImpact === 'full-closure'
              ? 'danger'
              : incident.accessImpact === 'none'
                ? 'success'
                : 'warning'
          }
          label={t(`map.incidentImpact.${incident.accessImpact}`)}
        />
      </View>

      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {endsAt
          ? t('map.incidentWindow', { start: startedAt, end: endsAt })
          : t('map.incidentStarted', { start: startedAt })}
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
