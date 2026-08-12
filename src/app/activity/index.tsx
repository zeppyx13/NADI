import { useRouter } from 'expo-router';
import { ArrowLeft, QrCode } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CampaignCard } from '@/components/incentive/campaign-card';
import { DemoActivityPanel } from '@/components/incentive/demo-activity-panel';
import { ImpactCard } from '@/components/incentive/impact-card';
import { ProgressSummaryCard } from '@/components/incentive/progress-summary-card';
import { RewardCard } from '@/components/incentive/reward-card';
import { MainScreenHeader } from '@/components/layout/main-screen-header';
import {
  AppButton,
  AppCard,
  AppText,
  IconButton,
  ScreenContainer,
} from '@/components/ui';
import { colors, iconSizes, layout, spacing } from '@/constants/theme';
import { useIncentive } from '@/context/incentive-context';
import { destinations } from '@/data/destinations';
import { partnerBusinesses } from '@/data/partner-businesses';
import { rewardDefinitions } from '@/data/rewards';
import { getRunningCampaigns } from '@/services/incentive-service';

/**
 * Everything progression-related lives on this deep screen. It is deliberately
 * not a tab: the bottom navigation stays Beranda, Jelajah, Peta, Peringatan,
 * Profil.
 */
export default function ActivityScreen() {
  const { t } = useTranslation(['incentive', 'itinerary']);
  const router = useRouter();
  const {
    progress,
    level,
    nextLevel,
    entitlements,
    achievements,
    state,
    claimReward,
    redeemEntitlementById,
  } = useIncentive();

  const campaigns = useMemo(() => getRunningCampaigns(), []);
  const targetNameById = useMemo(() => {
    const names = new Map<string, string>();
    destinations.forEach((item) => names.set(item.id, item.name));
    partnerBusinesses.forEach((item) => names.set(item.id, item.name));
    return names;
  }, []);

  const recentEntries = useMemo(
    () => [...state.ledger].reverse().slice(0, 8),
    [state.ledger],
  );

  const handleClaim = async (rewardId: string) => {
    const result = await claimReward(rewardId);
    if (result.status === 'insufficient-points') {
      Alert.alert(t('rewardsTitle'), t('rewardInsufficient'));
    }
  };

  const handleUse = async (entitlementId: string) => {
    const result = await redeemEntitlementById(entitlementId);
    if (result.status === 'already-redeemed') {
      Alert.alert(t('rewardsTitle'), t('rewardUsed'));
    }
    if (result.status === 'expired') {
      Alert.alert(t('rewardsTitle'), t('rewardExpired'));
    }
  };

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
          <MainScreenHeader title={t('title')} subtitle={t('subtitle')} />
        </View>
      </View>

      <ProgressSummaryCard
        progress={progress}
        level={level}
        nextLevel={nextLevel}
      />

      <AppButton
        fullWidth
        label={t('scanAction')}
        accessibilityLabel={t('scanTitle')}
        leadingIcon={<QrCode size={iconSizes.button} color={colors.neutral.white} />}
        onPress={() => router.push('/activity/scan')}
      />

      <ImpactCard impact={progress.impact} />

      <View style={styles.section}>
        <AppText variant="labelMd" color={colors.neutral.textSecondary}>
          {t('campaignsTitle')}
        </AppText>
        {campaigns.length === 0 ? (
          <AppCard variant="outlined" style={styles.emptyCard}>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('campaignsEmpty')}
            </AppText>
          </AppCard>
        ) : (
          campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              targetName={targetNameById.get(campaign.targetId)}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <AppText variant="labelMd" color={colors.neutral.textSecondary}>
          {t('rewardsTitle')}
        </AppText>
        {rewardDefinitions.map((definition) => {
          const entitlement = entitlements.find(
            (item) => item.rewardId === definition.id && item.status !== 'redeemed',
          );
          return (
            <RewardCard
              key={definition.id}
              definition={definition}
              entitlement={entitlement}
              canAfford={progress.pointsBalance >= definition.pointsCost}
              onClaim={
                entitlement || definition.pointsCost === 0
                  ? undefined
                  : () => void handleClaim(definition.id)
              }
              onUse={entitlement ? () => void handleUse(entitlement.id) : undefined}
            />
          );
        })}
      </View>

      <View style={styles.section}>
        <AppText variant="labelMd" color={colors.neutral.textSecondary}>
          {t('achievementsTitle')}
        </AppText>
        {achievements.map(({ definition, current, isUnlocked }) => (
          <AppCard key={definition.id} variant="outlined" style={styles.rowCard}>
            <View style={styles.copy}>
              <AppText
                variant="labelLg"
                color={isUnlocked ? colors.teal[700] : colors.neutral.textPrimary}
              >
                {t(definition.titleKey.replace('incentive.', ''))}
              </AppText>
              <AppText variant="caption" color={colors.neutral.textSecondary}>
                {t(definition.descriptionKey.replace('incentive.', ''))}
              </AppText>
            </View>
            <AppText variant="labelMd" color={colors.neutral.textSecondary}>
              {t('achievementProgress', {
                current: Math.min(current, definition.target),
                target: definition.target,
              })}
            </AppText>
          </AppCard>
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="labelMd" color={colors.neutral.textSecondary}>
          {t('partnersTitle')}
        </AppText>
        {partnerBusinesses.map((partner) => (
          <AppCard key={partner.id} variant="outlined" style={styles.rowCard}>
            <View style={styles.copy}>
              <AppText variant="labelLg">{partner.name}</AppText>
              <AppText variant="caption" color={colors.neutral.textSecondary}>
                {partner.area} · {t(partner.perkKey.replace('incentive.', ''))}
              </AppText>
            </View>
          </AppCard>
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="labelMd" color={colors.neutral.textSecondary}>
          {t('historyTitle')}
        </AppText>
        {recentEntries.length === 0 ? (
          <AppCard variant="outlined" style={styles.emptyCard}>
            <AppText variant="bodySm" color={colors.neutral.textSecondary}>
              {t('historyEmpty')}
            </AppText>
          </AppCard>
        ) : (
          recentEntries.map((entry) => (
            <AppCard key={entry.id} variant="outlined" style={styles.rowCard}>
              <View style={styles.copy}>
                <AppText variant="labelLg">
                  {entry.targetName ??
                    t(
                      `historyReason.${entry.reasonCode}` as 'historyReason.base-activity',
                    )}
                </AppText>
                <AppText variant="caption" color={colors.neutral.textSecondary}>
                  {t(
                    `historyReason.${entry.reasonCode}` as 'historyReason.base-activity',
                  )}
                </AppText>
              </View>
              <AppText variant="labelMd" color={colors.teal[700]}>
                {t('historyAward', {
                  xp: entry.xpDelta,
                  points: entry.pointsDelta,
                })}
              </AppText>
            </AppCard>
          ))
        )}
      </View>

      <DemoActivityPanel />
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
  section: {
    gap: spacing[2],
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
  },
  emptyCard: {
    padding: spacing[4],
  },
  copy: {
    flex: 1,
    gap: 2,
  },
});
