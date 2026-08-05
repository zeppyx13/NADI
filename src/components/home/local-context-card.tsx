import { CalendarDays, MapPin, PartyPopper } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText, SectionHeader } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { TravelAlert } from '@/types/travel-alert';

export type LocalContextCardProps = {
  alert: TravelAlert;
  onViewAll: () => void;
};

export function LocalContextCard({
  alert,
  onViewAll,
}: LocalContextCardProps) {
  const { t, i18n } = useTranslation(['home', 'screens']);
  const timeFormatter = new Intl.DateTimeFormat(
    i18n.language === 'id' ? 'id-ID' : 'en-US',
    { hour: '2-digit', minute: '2-digit' },
  );
  const schedule = alert.activeWindow
    ? t('localContext.schedule', {
        ns: 'home',
        start: timeFormatter.format(new Date(alert.activeWindow.startsAt)),
        end: timeFormatter.format(new Date(alert.activeWindow.endsAt)),
      })
    : null;

  return (
    <View>
      <SectionHeader
        title={t('localContext.title', { ns: 'home' })}
        action={{
          label: t('localContext.viewAll', { ns: 'home' }),
          onPress: onViewAll,
        }}
      />
      <AppCard variant="soft" style={styles.card}>
        <View style={styles.icon}>
          <PartyPopper size={iconSizes.header} color={colors.teal[700]} />
        </View>
        <View style={styles.content}>
          <AppText variant="headingSm">
            {t(alert.titleKey, { ns: 'screens' })}
          </AppText>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {t(alert.descriptionKey, { ns: 'screens' })}
          </AppText>
          <View style={styles.metadata}>
            <MapPin size={iconSizes.inline} color={colors.neutral.iconMuted} />
            <AppText variant="caption" color={colors.neutral.textSecondary}>
              {alert.locationName}
            </AppText>
          </View>
          {schedule && (
            <View style={styles.metadata}>
              <CalendarDays size={iconSizes.inline} color={colors.neutral.iconMuted} />
              <AppText variant="caption" color={colors.neutral.textSecondary}>
                {schedule}
              </AppText>
            </View>
          )}
          <AppButton
            size="sm"
            variant="secondary"
            label={t('localContext.viewAlerts', { ns: 'home' })}
            onPress={onViewAll}
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
    backgroundColor: colors.teal[100],
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});
