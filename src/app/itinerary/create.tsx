import { useRouter } from 'expo-router';
import { ListChecks, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ItineraryScreenHeader } from '@/components/itinerary/itinerary-screen-header';
import { AppButton, AppCard, AppText, ScreenContainer } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';

export default function ItineraryCreateScreen() {
  const { t } = useTranslation('itinerary');
  const router = useRouter();

  return (
    <ScreenContainer
      scroll
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.screen}
    >
      <ItineraryScreenHeader
        title={t('creation.title')}
        subtitle={t('creation.subtitle')}
        backLabel={t('common.back')}
        onBack={() => router.back()}
      />

      <AppCard variant="elevated" style={styles.option}>
        <View style={styles.iconBlue}>
          <ListChecks size={iconSizes.header} color={colors.brand[700]} />
        </View>
        <AppText variant="headingMd">{t('creation.manualTitle')}</AppText>
        <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
          {t('creation.manualDescription')}
        </AppText>
        <AppButton
          fullWidth
          label={t('creation.manualAction')}
          onPress={() => router.push('/itinerary/manual')}
        />
      </AppCard>

      <AppCard variant="elevated" style={styles.option}>
        <View style={styles.iconTeal}>
          <Sparkles size={iconSizes.header} color={colors.teal[700]} />
        </View>
        <AppText variant="headingMd">{t('creation.assistedTitle')}</AppText>
        <AppText variant="bodyMd" color={colors.neutral.textSecondary}>
          {t('creation.assistedDescription')}
        </AppText>
        <AppButton
          fullWidth
          variant="teal"
          label={t('creation.assistedAction')}
          onPress={() => router.push('/itinerary/preferences')}
        />
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing[3],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  option: {
    gap: spacing[3],
  },
  iconBlue: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.brand[50],
  },
  iconTeal: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.teal[50],
  },
});
