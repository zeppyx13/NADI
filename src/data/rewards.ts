import type { RewardDefinition } from '@/types/incentive';

/**
 * Prototype rewards. Every entitlement is local: there is no partner system,
 * no payment, and no settlement behind these, and the copy never claims one.
 */
export const rewardDefinitions: readonly RewardDefinition[] = [
  {
    id: 'reward-parking-voucher',
    kind: 'parking-voucher',
    titleKey: 'incentive.rewards.parkingVoucher.title',
    descriptionKey: 'incentive.rewards.parkingVoucher.description',
    pointsCost: 60,
    validityDays: 30,
  },
  {
    id: 'reward-partner-discount',
    kind: 'partner-discount',
    titleKey: 'incentive.rewards.partnerDiscount.title',
    descriptionKey: 'incentive.rewards.partnerDiscount.description',
    pointsCost: 100,
    partnerId: 'partner-warung-lovina',
    validityDays: 30,
  },
  {
    id: 'reward-local-perk',
    kind: 'local-perk',
    titleKey: 'incentive.rewards.localPerk.title',
    descriptionKey: 'incentive.rewards.localPerk.description',
    pointsCost: 80,
    partnerId: 'partner-tenun-besakih',
    validityDays: 45,
  },
  {
    id: 'reward-bonus-points',
    kind: 'bonus-points',
    titleKey: 'incentive.rewards.bonusPoints.title',
    descriptionKey: 'incentive.rewards.bonusPoints.description',
    pointsCost: 0,
    validityDays: 7,
    bonusPoints: 25,
  },
];
