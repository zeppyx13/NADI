import {
  CalendarDays,
  CarFront,
  CircleAlert,
  Construction,
  MapPin,
  PartyPopper,
  TriangleAlert,
  UsersRound,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppBadge, AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type {
  AlertSeverity,
  TravelAlert,
  TravelAlertType,
} from '@/types/travel-alert';

const alertIcons: Record<TravelAlertType, LucideIcon> = {
  traffic: CarFront,
  incident: CircleAlert,
  'road-closure': Construction,
  'destination-crowd': UsersRound,
  'local-event': PartyPopper,
};

const severityColors: Record<
  AlertSeverity,
  { background: string; foreground: string }
> = {
  info: {
    background: colors.semantic.info.bg,
    foreground: colors.semantic.info.text,
  },
  warning: {
    background: colors.semantic.warning.bg,
    foreground: colors.semantic.warning.text,
  },
  danger: {
    background: colors.semantic.danger.bg,
    foreground: colors.semantic.danger.text,
  },
};

export type TravelAlertCardProps = {
  alert: TravelAlert;
  onViewMap: () => void;
};

export function TravelAlertCard({ alert, onViewMap }: TravelAlertCardProps) {
  const { t, i18n } = useTranslation('screens');
  const Icon = alertIcons[alert.type] ?? TriangleAlert;
  const severity = severityColors[alert.severity];
  const formattedTime = new Intl.DateTimeFormat(
    i18n.language === 'id' ? 'id-ID' : 'en-US',
    { hour: '2-digit', minute: '2-digit' },
  ).format(new Date(alert.createdAt));

  return (
    <AppCard variant="default" style={!alert.isRead ? styles.unreadCard : undefined}>
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: severity.background }]}>
          <Icon size={iconSizes.header} color={severity.foreground} />
          {!alert.isRead && <View style={styles.unreadDot} />}
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <AppText variant="headingSm" style={styles.title}>
              {t(alert.titleKey)}
            </AppText>
            <AppBadge
              size="sm"
              variant={alert.severity}
              label={t(`status.severity.${alert.severity}`)}
            />
          </View>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t(alert.descriptionKey)}
          </AppText>
        </View>
      </View>

      <View style={styles.metadata}>
        <View style={styles.metadataItem}>
          <MapPin size={iconSizes.inline} color={colors.neutral.iconMuted} />
          <AppText
            variant="caption"
            color={colors.neutral.textSecondary}
            style={styles.location}
          >
            {alert.locationName}
          </AppText>
        </View>
        <View style={styles.metadataItem}>
          <CalendarDays size={iconSizes.inline} color={colors.neutral.iconMuted} />
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {t('alerts.timeAt', { time: formattedTime })}
          </AppText>
        </View>
      </View>

      <AppButton
        size="sm"
        variant="secondary"
        label={t('alerts.viewOnMap')}
        onPress={onViewMap}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  unreadCard: {
    borderColor: colors.brand[200],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.brand[600],
    borderWidth: 2,
    borderColor: colors.neutral.white,
  },
  copy: {
    flex: 1,
    gap: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  title: {
    flex: 1,
  },
  metadata: {
    marginVertical: spacing[3],
    gap: spacing[2],
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  location: {
    flex: 1,
  },
});
