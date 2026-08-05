import { Navigation, Route } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { RouteModeBadge } from '@/components/route/route-mode-badge';
import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import type { ActiveJourney } from '@/types/home';

export type JourneyCardProps = {
  journey: ActiveJourney | null;
  onPress: () => void;
};

export function JourneyCard({ journey, onPress }: JourneyCardProps) {
  const { t, i18n } = useTranslation('home');

  if (!journey) {
    return (
      <AppCard variant="soft" style={styles.card}>
        <View style={styles.headingRow}>
          <View style={styles.icon}>
            <Route size={iconSizes.header} color={colors.teal[700]} />
          </View>
          <View style={styles.copy}>
            <AppText variant="headingSm">{t('planJourney.title')}</AppText>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('planJourney.description')}
            </AppText>
          </View>
        </View>
        <AppButton
          fullWidth
          variant="teal"
          label={t('planJourney.action')}
          leadingIcon={
            <Navigation size={iconSizes.button} color={colors.neutral.white} />
          }
          onPress={onPress}
        />
      </AppCard>
    );
  }

  const formattedDistance = new Intl.NumberFormat(
    i18n.language === 'id' ? 'id-ID' : 'en-US',
    { maximumFractionDigits: 1 },
  ).format(journey.distanceKm);

  return (
    <AppCard variant="elevated" style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.copy}>
          <AppText variant="caption" color={colors.brand[600]}>
            {t('activeJourney.title')}
          </AppText>
          <AppText variant="headingSm">
            {t('activeJourney.headingTo', {
              destination: journey.destinationName,
            })}
          </AppText>
        </View>
        <RouteModeBadge mode={journey.routeMode} />
      </View>
      <AppText variant="labelMd" color={colors.brand[700]}>
        {t('activeJourney.metadata', {
          minutes: journey.etaMinutes,
          distance: formattedDistance,
        })}
      </AppText>
      <AppText variant="bodySm" color={colors.neutral.textSecondary}>
        {t(`activeJourney.${journey.status}`)}
      </AppText>
      <AppButton
        fullWidth
        label={t('activeJourney.continue')}
        leadingIcon={
          <Navigation size={iconSizes.button} color={colors.neutral.white} />
        }
        onPress={onPress}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.teal[50],
  },
  copy: {
    flex: 1,
    minWidth: 180,
    gap: spacing[1],
  },
});
