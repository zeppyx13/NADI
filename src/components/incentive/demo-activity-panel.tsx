import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton, AppCard, AppText } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { useIncentive } from '@/context/incentive-context';
import type { ActivityEvent } from '@/types/incentive';

/**
 * Development-only shortcut for recording a verified activity, so the incentive
 * flows can be exercised without physical codes. It renders nothing outside
 * `__DEV__`, so a production build never shows a prototype control.
 *
 * Each button uses a fixed event id, which also demonstrates that a repeated
 * activity is rejected rather than awarded twice.
 */
export function DemoActivityPanel() {
  const { t } = useTranslation('incentive');
  const { recordActivity } = useIncentive();

  if (!__DEV__) return null;

  const record = (event: ActivityEvent) => {
    void recordActivity(event);
  };

  const now = () => new Date().toISOString();

  return (
    <AppCard variant="outlined" style={styles.card}>
      <AppText variant="labelLg">{t('demoTitle')}</AppText>
      <AppText variant="caption" color={colors.neutral.textSecondary}>
        {t('demoDescription')}
      </AppText>

      <View style={styles.actions}>
        <AppButton
          size="sm"
          variant="secondary"
          label={t('demoVisitAlternative')}
          onPress={() =>
            record({
              id: `demo-lovina-${Date.now()}`,
              type: 'destination-visit',
              targetType: 'destination',
              targetId: 'pantai-lovina',
              targetName: 'Pantai Lovina',
              verification: 'journey-arrival',
              occurredAt: now(),
            })
          }
        />
        <AppButton
          size="sm"
          variant="secondary"
          label={t('demoPartnerCheckIn')}
          onPress={() =>
            record({
              id: `demo-partner-${Date.now()}`,
              type: 'partner-visit',
              targetType: 'partner',
              targetId: 'partner-warung-lovina',
              targetName: 'Warung Bahari Lovina',
              verification: 'qr-check-in',
              occurredAt: now(),
            })
          }
        />
        <AppButton
          size="sm"
          variant="secondary"
          label={t('demoAcceptRecommendation')}
          onPress={() =>
            record({
              id: `demo-accept-${Date.now()}`,
              type: 'recommendation-accepted',
              targetType: 'destination',
              targetId: 'tanah-lot',
              targetName: 'Tanah Lot',
              verification: 'in-app-action',
              occurredAt: now(),
            })
          }
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[2],
    padding: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
