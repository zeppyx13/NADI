import type { IncentiveCampaign } from '@/types/incentive';

/**
 * Local stand-in for a tourism flow management backend.
 *
 * A campaign is the only route by which a visit earns more than its base award.
 * It is the place where capacity, timing and policy are weighed, so NADI never
 * simply pushes travellers toward whatever is emptiest.
 *
 * These entries are authored locally and deterministic. Nothing here is a live
 * government or authority feed.
 */
export const incentiveCampaigns: readonly IncentiveCampaign[] = [
  {
    id: 'campaign-lovina-alternative',
    targetType: 'destination',
    targetId: 'pantai-lovina',
    objective: 'alternative-destination',
    titleKey: 'incentive.campaigns.lovinaAlternative.title',
    descriptionKey: 'incentive.campaigns.lovinaAlternative.description',
    startAt: '2026-08-01T00:00:00+08:00',
    endAt: '2026-12-31T23:59:59+08:00',
    rewardMultiplier: 1.6,
    bonusPoints: 15,
    eligibility: {
      requiredVerification: ['qr-check-in', 'journey-arrival'],
      maxClaimsPerUser: 2,
    },
    maxXpPerClaim: 150,
    maxPointsPerClaim: 40,
  },
  {
    id: 'campaign-tanah-lot-off-peak',
    targetType: 'destination',
    targetId: 'tanah-lot',
    objective: 'off-peak-visit',
    titleKey: 'incentive.campaigns.tanahLotOffPeak.title',
    descriptionKey: 'incentive.campaigns.tanahLotOffPeak.description',
    startAt: '2026-08-01T00:00:00+08:00',
    endAt: '2026-12-31T23:59:59+08:00',
    rewardMultiplier: 1.4,
    bonusPoints: 10,
    eligibility: {
      // Morning window, well before the sunset crowd builds.
      timeWindow: { startsAt: '06:00', endsAt: '11:00' },
      requiredVerification: ['qr-check-in', 'journey-arrival'],
      maxClaimsPerUser: 1,
    },
    maxXpPerClaim: 120,
    maxPointsPerClaim: 30,
  },
  {
    id: 'campaign-besakih-redistribute',
    targetType: 'destination',
    targetId: 'pura-besakih',
    objective: 'redistribute-visits',
    titleKey: 'incentive.campaigns.besakihRedistribute.title',
    descriptionKey: 'incentive.campaigns.besakihRedistribute.description',
    startAt: '2026-08-01T00:00:00+08:00',
    endAt: '2026-12-31T23:59:59+08:00',
    rewardMultiplier: 1.5,
    bonusPoints: 12,
    eligibility: {
      requiredVerification: ['qr-check-in', 'journey-arrival'],
      maxClaimsPerUser: 2,
    },
    maxXpPerClaim: 140,
    maxPointsPerClaim: 35,
  },
  {
    id: 'campaign-warung-lovina-local',
    targetType: 'partner',
    targetId: 'partner-warung-lovina',
    objective: 'support-local-business',
    titleKey: 'incentive.campaigns.warungLovinaLocal.title',
    descriptionKey: 'incentive.campaigns.warungLovinaLocal.description',
    startAt: '2026-08-01T00:00:00+08:00',
    endAt: '2026-12-31T23:59:59+08:00',
    rewardMultiplier: 1.5,
    bonusPoints: 20,
    eligibility: {
      requiredVerification: ['qr-check-in'],
      maxClaimsPerUser: 3,
    },
    maxXpPerClaim: 120,
    maxPointsPerClaim: 50,
  },
  {
    id: 'campaign-tenun-besakih-local',
    targetType: 'partner',
    targetId: 'partner-tenun-besakih',
    objective: 'support-local-business',
    titleKey: 'incentive.campaigns.tenunBesakihLocal.title',
    descriptionKey: 'incentive.campaigns.tenunBesakihLocal.description',
    startAt: '2026-08-01T00:00:00+08:00',
    endAt: '2026-12-31T23:59:59+08:00',
    rewardMultiplier: 1.4,
    bonusPoints: 18,
    eligibility: {
      requiredVerification: ['qr-check-in'],
      maxClaimsPerUser: 3,
    },
    maxXpPerClaim: 120,
    maxPointsPerClaim: 45,
  },
  {
    id: 'campaign-kuta-expired',
    targetType: 'destination',
    targetId: 'pantai-kuta',
    objective: 'off-peak-visit',
    titleKey: 'incentive.campaigns.kutaExpired.title',
    descriptionKey: 'incentive.campaigns.kutaExpired.description',
    // Deliberately in the past: proves an expired campaign grants no bonus.
    startAt: '2026-06-01T00:00:00+08:00',
    endAt: '2026-06-30T23:59:59+08:00',
    rewardMultiplier: 1.5,
    bonusPoints: 15,
    eligibility: {
      requiredVerification: ['qr-check-in'],
      maxClaimsPerUser: 1,
    },
    maxXpPerClaim: 120,
    maxPointsPerClaim: 30,
  },
];
