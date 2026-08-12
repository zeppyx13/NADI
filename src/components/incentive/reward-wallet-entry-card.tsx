import { useRouter } from 'expo-router';
import { ChevronRight, Ticket } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard, AppText } from '@/components/ui';
import { colors, iconSizes, radii, spacing } from '@/constants/theme';
import { useIncentive } from '@/context/incentive-context';

/**
 * Profile entry to the voucher wallet. It only counts what the traveller
 * actually holds; rewards still to be earned live on the activity screen.
 */
export function RewardWalletEntryCard() {
  const { t } = useTranslation('incentive');
  const router = useRouter();
  const { entitlements } = useIncentive();

  const usable = entitlements.filter(
    (item) => item.status === 'available' || item.status === 'claimed',
  ).length;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('walletEntry')}, ${usable}`}
      onPress={() => router.push('/activity/rewards')}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <AppCard variant="outlined" style={styles.card}>
        <View style={styles.iconWrap}>
          <Ticket size={iconSizes.button} color={colors.teal[700]} />
        </View>
        <View style={styles.copy}>
          <AppText variant="labelLg">{t('walletEntry')}</AppText>
          <AppText variant="caption" color={colors.neutral.textSecondary}>
            {usable > 0
              ? t('walletTabActive') + ` · ${usable}`
              : t('walletEntrySubtitle')}
          </AppText>
        </View>
        <ChevronRight size={iconSizes.button} color={colors.neutral.iconMuted} />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.teal[50],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.72,
  },
});
