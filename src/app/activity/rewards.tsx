import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { RewardCard } from '@/components/incentive/reward-card';
import { MainScreenHeader } from '@/components/layout/main-screen-header';
import {
  AppCard,
  AppText,
  IconButton,
  ScreenContainer,
} from '@/components/ui';
import { colors, iconSizes, layout, radii, spacing } from '@/constants/theme';
import { useIncentive } from '@/context/incentive-context';
import { getRewardDefinition } from '@/services/incentive-service';
import type { RewardStatus } from '@/types/incentive';

type WalletTab = 'active' | 'used';

/**
 * The traveller's own vouchers, split into what is still usable and what is
 * finished. Rewards not yet obtained live on the activity screen instead.
 */
export default function RewardWalletScreen() {
  const { t } = useTranslation(['incentive', 'itinerary']);
  const router = useRouter();
  const { entitlements, progress, redeemEntitlementById } = useIncentive();
  const [tab, setTab] = useState<WalletTab>('active');

  const activeStatuses: readonly RewardStatus[] = ['available', 'claimed'];
  const grouped = useMemo(() => {
    const active = entitlements.filter((item) =>
      activeStatuses.includes(item.status),
    );
    const used = entitlements.filter(
      (item) => item.status === 'redeemed' || item.status === 'expired',
    );
    return { active, used };
    // `activeStatuses` is a literal, stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entitlements]);

  const shown = tab === 'active' ? grouped.active : grouped.used;

  const handleUse = async (entitlementId: string) => {
    const result = await redeemEntitlementById(entitlementId);
    if (result.status === 'already-redeemed') {
      Alert.alert(t('walletTitle'), t('rewardUsed'));
    }
    if (result.status === 'expired') {
      Alert.alert(t('walletTitle'), t('rewardExpired'));
    }
  };

  const tabs: readonly { id: WalletTab; label: string; count: number }[] = [
    { id: 'active', label: t('walletTabActive'), count: grouped.active.length },
    { id: 'used', label: t('walletTabUsed'), count: grouped.used.length },
  ];

  return (
    <ScreenContainer scroll style={styles.content}>
      <View style={styles.headerRow}>
        <IconButton
          accessibilityLabel={t('common.back', { ns: 'itinerary' })}
          icon={
            <ArrowLeft
              size={iconSizes.header}
              color={colors.neutral.textPrimary}
            />
          }
          onPress={() => router.back()}
        />
        <View style={styles.headerCopy}>
          <MainScreenHeader
            title={t('walletTitle')}
            subtitle={t('walletSubtitle', { count: progress.pointsBalance })}
          />
        </View>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {tabs.map((item) => {
          const selected = item.id === tab;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${item.label}, ${item.count}`}
              onPress={() => setTab(item.id)}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabSelected,
                pressed && styles.tabPressed,
              ]}
            >
              <AppText
                variant="labelMd"
                color={selected ? colors.brand[700] : colors.neutral.textSecondary}
              >
                {item.label} · {item.count}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 ? (
        <AppCard variant="outlined" style={styles.emptyCard}>
          <AppText variant="bodySm" color={colors.neutral.textSecondary}>
            {tab === 'active' ? t('walletEmptyActive') : t('walletEmptyUsed')}
          </AppText>
        </AppCard>
      ) : (
        shown.map((entitlement) => {
          const definition = getRewardDefinition(entitlement.rewardId);
          if (!definition) return null;
          return (
            <RewardCard
              key={entitlement.id}
              definition={definition}
              entitlement={entitlement}
              canAfford
              onUse={
                entitlement.status === 'available'
                  ? () => void handleUse(entitlement.id)
                  : undefined
              }
            />
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: layout.cardGap,
    paddingBottom: spacing[10],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  headerCopy: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tab: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.neutral.borderSoft,
    backgroundColor: colors.neutral.white,
  },
  tabSelected: {
    borderColor: colors.brand[300],
    backgroundColor: colors.brand[50],
  },
  tabPressed: {
    opacity: 0.72,
  },
  emptyCard: {
    padding: spacing[4],
  },
});
