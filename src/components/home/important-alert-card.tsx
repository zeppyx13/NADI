import {
  ChevronRight,
  MapPin,
  TriangleAlert,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { AlertSeverity, TravelAlert } from '@/types/travel-alert';

export type ImportantAlertCardProps = {
  alert: TravelAlert;
  distanceKm?: number;
  emphasized?: boolean;
  onPress: () => void;
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
  emphasized = false,
  onPress,
}: ImportantAlertCardProps) {
  const { t, i18n } = useTranslation(['home', 'screens']);
  const severity = severityColors[alert.severity];
  const formattedDistance =
    distanceKm === undefined
      ? null
      : new Intl.NumberFormat(i18n.language === 'id' ? 'id-ID' : 'en-US', {
          maximumFractionDigits: 1,
        }).format(distanceKm);
  const title = t(alert.titleKey, { ns: 'screens' });
  const locationSummary = formattedDistance
    ? `${alert.locationName} · ${t('importantAlert.distanceAway', {
        ns: 'home',
        distance: formattedDistance,
      })}`
    : alert.locationName;
  const location = `${locationSummary} · ${t('importantAlert.localEstimate', {
    ns: 'home',
  })}`;

  if (!emphasized) {
    return (
      <AppCard
        variant="soft"
        accessibilityLabel={`${t('importantAlert.title', { ns: 'home' })}. ${title}. ${location}`}
        onPress={onPress}
        style={styles.compactCard}
      >
        <View
          style={[
            styles.compactIcon,
            { backgroundColor: severity.background },
          ]}
        >
          <TriangleAlert size={iconSizes.button} color={severity.foreground} />
        </View>
        <View style={styles.compactCopy}>
          <AppText variant="labelLg" numberOfLines={2}>
            {title}
          </AppText>
          <AppText
            variant="caption"
            color={colors.neutral.textSecondary}
            numberOfLines={1}
          >
            {location}
          </AppText>
        </View>
        <ChevronRight size={iconSizes.button} color={colors.neutral.iconMuted} />
      </AppCard>
    );
  }

  return (
    <AppCard
      style={[styles.affectedCard, { borderColor: severity.foreground }]}
    >
      <View style={styles.affectedHeading}>
        <View style={[styles.icon, { backgroundColor: severity.background }]}>
          <TriangleAlert size={iconSizes.header} color={severity.foreground} />
        </View>
        <View style={styles.content}>
          <AppText variant="caption" color={severity.foreground}>
            {t('importantAlert.journeyAffected', { ns: 'home' })}
          </AppText>
          <AppText variant="headingSm">{title}</AppText>
        </View>
      </View>
      <View style={styles.locationRow}>
        <MapPin size={iconSizes.inline} color={colors.neutral.iconMuted} />
        <AppText
          variant="caption"
          color={colors.neutral.textSecondary}
          style={styles.location}
        >
          {location}
        </AppText>
      </View>
      <AppText variant="bodySm" color={colors.neutral.textSecondary}>
        {t(alert.descriptionKey, { ns: 'screens' })}
      </AppText>
      <AppButton
        size="sm"
        variant="secondary"
        label={t('importantAlert.reviewRoute', { ns: 'home' })}
        onPress={onPress}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
  },
  compactIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  compactCopy: {
    flex: 1,
    gap: spacing[1],
  },
  affectedCard: {
    gap: spacing[3],
  },
  affectedHeading: {
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
    gap: spacing[1],
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
