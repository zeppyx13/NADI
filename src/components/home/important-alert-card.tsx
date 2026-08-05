import { MapPin, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText, SectionHeader } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { AlertSeverity, TravelAlert } from '@/types/travel-alert';

export type ImportantAlertCardProps = {
  alert: TravelAlert;
  distanceKm?: number;
  onOpenMap: () => void;
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

export function ImportantAlertCard({
  alert,
  distanceKm,
  onOpenMap,
}: ImportantAlertCardProps) {
  const { t, i18n } = useTranslation(['home', 'screens']);
  const severity = severityColors[alert.severity];
  const formattedDistance =
    distanceKm === undefined
      ? null
      : new Intl.NumberFormat(i18n.language === 'id' ? 'id-ID' : 'en-US', {
          maximumFractionDigits: 1,
        }).format(distanceKm);

  return (
    <View>
      <SectionHeader title={t('importantAlert.title', { ns: 'home' })} />
      <AppCard style={[styles.card, { borderColor: severity.background }]}>
        <View style={[styles.icon, { backgroundColor: severity.background }]}>
          <TriangleAlert size={iconSizes.header} color={severity.foreground} />
        </View>
        <View style={styles.content}>
          <AppText variant="headingSm">
            {t(alert.titleKey, { ns: 'screens' })}
          </AppText>
          <View style={styles.locationRow}>
            <MapPin size={iconSizes.inline} color={colors.neutral.iconMuted} />
            <AppText
              variant="caption"
              color={colors.neutral.textSecondary}
              style={styles.location}
            >
              {alert.locationName}
              {formattedDistance
                ? ` · ${t('importantAlert.distanceAway', {
                    ns: 'home',
                    distance: formattedDistance,
                  })}`
                : ''}
            </AppText>
          </View>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t(alert.descriptionKey, { ns: 'screens' })}
          </AppText>
          <AppButton
            size="sm"
            variant="secondary"
            label={t('importantAlert.alternativeRoute', { ns: 'home' })}
            onPress={onOpenMap}
          />
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  location: {
    flex: 1,
  },
});
